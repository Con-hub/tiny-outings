import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AgeBandBadge } from "./age-band-badge";
import { FeatureBadge } from "./feature-badge";
import { Heart, MapPin, Clock, Navigation, ExternalLink, Calendar, RotateCw, Share2, ThumbsUp, Footprints, Send, MessageCircle } from "lucide-react";
import { formatDistance, formatCost, getCategoryLabel, formatFriendlyDate, getNextRecurringDates } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Event, Place, Review } from "@shared/schema";

// Simple session ID — persists via React state for the app lifetime
let _sessionId: string | null = null;
function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return _sessionId;
}

interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  event?: (Event & { distance?: number }) | null;
  place?: (Place & { distance?: number }) | null;
}

export function DetailSheet({ open, onClose, event, place }: DetailSheetProps) {
  const { data: favourites } = useQuery<any[]>({ queryKey: ["/api/favourites"] });
  const { toast } = useToast();
  const item = event || place;
  if (!item) return null;

  const isEvent = !!event;
  const ageBands: string[] = JSON.parse(isEvent ? event!.ageBands : place!.ageBands);
  const features: string[] = JSON.parse(isEvent ? event!.childFeatures : place!.childFeatures);
  const isFav = favourites?.some(f =>
    isEvent ? f.eventId === event!.id : f.placeId === place!.id
  );
  const favId = favourites?.find(f =>
    isEvent ? f.eventId === event!.id : f.placeId === place!.id
  )?.id;

  const nextDates = isEvent && event!.recurring && event!.recurrencePattern
    ? getNextRecurringDates(event!.recurrencePattern, 3)
    : [];

  const toggleFavourite = async () => {
    if (isFav && favId) {
      await apiRequest("DELETE", `/api/favourites/${favId}`);
    } else {
      await apiRequest("POST", "/api/favourites", isEvent ? { eventId: event!.id } : { placeId: place!.id });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    isEvent ? `${event!.venueName} ${event!.address}` : `${place!.name} ${place!.address}`
  )}`;

  const handleShare = async () => {
    const title = isEvent ? event!.title : place!.name;
    const text = isEvent
      ? `${event!.title} — ${formatFriendlyDate(event!.date)} at ${event!.startTime}, ${event!.venueName}`
      : `${place!.name} — ${place!.address}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        // User cancelled — do nothing
      }
    } else {
      // Fallback: copy text to clipboard
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: text });
      } catch {
        toast({ title: "Share", description: text });
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-8">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg font-extrabold leading-tight pr-8">
            {isEvent ? event!.title : place!.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Age bands */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ageBands.map(band => (
              <AgeBandBadge key={band} band={band} />
            ))}
            <span className="text-sm text-muted-foreground font-medium ml-2">
              {getCategoryLabel(isEvent ? event!.category : place!.category)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed">{isEvent ? event!.description : place!.description}</p>

          {/* Event-specific details */}
          {isEvent && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{formatFriendlyDate(event!.date)} at {event!.startTime}{event!.endTime ? `\u2013${event!.endTime}` : ""}</span>
              </div>
              {event!.recurring && event!.recurrencePattern && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <RotateCw className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{event!.recurrencePattern}</span>
                  </div>
                  {nextDates.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-6">
                      Next: {nextDates.join(" · ")}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className={`font-bold text-base ${event!.isFree ? "text-primary" : ""}`}>
                  {formatCost(event!.cost, event!.currency, event!.isFree)}
                </span>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{isEvent ? `${event!.venueName}, ${event!.address}` : place!.address}</span>
            </div>
            {(item as any).distance !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Navigation className="w-4 h-4 flex-shrink-0" />
                <span>{formatDistance((item as any).distance)} away</span>
              </div>
            )}
          </div>

          {/* Place opening hours */}
          {!isEvent && place!.openingHours && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{place!.openingHours}</span>
            </div>
          )}

          {/* Child features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map(f => (
                <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-xs text-accent-foreground font-medium">
                  <FeatureBadge feature={f} />
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant={isFav ? "default" : "secondary"}
              className="flex-1"
              onClick={toggleFavourite}
              data-testid="toggle-favourite"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFav ? "fill-current" : ""}`} />
              {isFav ? "Saved" : "Save"}
            </Button>
            <Button variant="secondary" className="flex-1" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-testid="link-maps">
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </a>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleShare}
              data-testid="share-button"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* External link */}
          {((isEvent && event!.externalUrl) || (!isEvent && place!.website)) && (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={isEvent ? event!.externalUrl! : place!.website!}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-external"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                Visit website
              </a>
            </Button>
          )}

          {/* Community feedback — reactions + reviews (events only) */}
          {isEvent && (
            <CommunityFeedback eventId={event!.id} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CommunityFeedback({ eventId }: { eventId: number }) {
  const sessionId = getSessionId();
  const { toast } = useToast();
  const [reviewText, setReviewText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch reactions for this event
  const { data: reactionData } = useQuery<{
    beenThere: number;
    recommend: number;
    hasBeenThere: boolean;
    hasRecommended: boolean;
  }>({
    queryKey: ["/api/events", eventId, "reactions", `?sessionId=${sessionId}`],
    queryFn: async () => {
      const res = await fetch(`${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/events/${eventId}/reactions?sessionId=${sessionId}`);
      return res.json();
    },
  });

  // Fetch reviews
  const { data: reviewsList } = useQuery<Review[]>({
    queryKey: ["/api/events", eventId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/events/${eventId}/reviews`);
      return res.json();
    },
  });

  // React mutation
  const reactMutation = useMutation({
    mutationFn: async (type: "been_there" | "recommend") => {
      const res = await apiRequest("POST", `/api/events/${eventId}/reactions`, { type, sessionId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "reactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reaction-counts"] });
    },
    onError: () => {
      toast({ title: "Already recorded", description: "You've already shared this feedback" });
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/events/${eventId}/reviews`, {
        displayName: displayName.trim() || "A local mum",
        text: reviewText.trim(),
        sessionId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "reviews"] });
      setReviewText("");
      setDisplayName("");
      setShowReviewForm(false);
      toast({ title: "Thanks for sharing", description: "Your review helps other mums" });
    },
    onError: () => {
      toast({ title: "Couldn't submit", description: "Please try again" });
    },
  });

  const beenThere = reactionData?.beenThere || 0;
  const recommend = reactionData?.recommend || 0;
  const hasBeenThere = reactionData?.hasBeenThere || false;
  const hasRecommended = reactionData?.hasRecommended || false;

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border/50" data-testid="community-feedback">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Community Feedback</span>
      </div>

      {/* Reaction buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => !hasBeenThere && reactMutation.mutate("been_there")}
          disabled={hasBeenThere || reactMutation.isPending}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
            hasBeenThere
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-accent text-accent-foreground hover:bg-accent/80 border border-transparent"
          }`}
          data-testid="btn-been-there"
        >
          <Footprints className="w-4 h-4" />
          <span>Been there{beenThere > 0 ? ` (${beenThere})` : ""}</span>
        </button>
        <button
          onClick={() => !hasRecommended && reactMutation.mutate("recommend")}
          disabled={hasRecommended || reactMutation.isPending}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
            hasRecommended
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-accent text-accent-foreground hover:bg-accent/80 border border-transparent"
          }`}
          data-testid="btn-recommend"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Recommend{recommend > 0 ? ` (${recommend})` : ""}</span>
        </button>
      </div>

      {/* Reviews list */}
      {reviewsList && reviewsList.length > 0 && (
        <div className="flex flex-col gap-2" data-testid="reviews-list">
          {reviewsList.slice(0, 5).map((review) => (
            <div key={review.id} className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-accent/50">
              <p className="text-sm leading-relaxed">"{review.text}"</p>
              <span className="text-xs text-muted-foreground">— {review.displayName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add review */}
      {!showReviewForm ? (
        <button
          onClick={() => setShowReviewForm(true)}
          className="text-xs text-primary font-medium text-left hover:underline"
          data-testid="btn-add-review"
        >
          + Share a quick review
        </button>
      ) : (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-accent/30 border border-border/50" data-testid="review-form">
          <input
            type="text"
            placeholder="Your name (e.g. Sarah, mum of 2)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={50}
            data-testid="input-display-name"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Quick one-liner review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={200}
              data-testid="input-review-text"
              onKeyDown={(e) => {
                if (e.key === "Enter" && reviewText.trim()) {
                  reviewMutation.mutate();
                }
              }}
            />
            <Button
              size="sm"
              disabled={!reviewText.trim() || reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
              data-testid="btn-submit-review"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground">{reviewText.length}/200</span>
        </div>
      )}
    </div>
  );
}
