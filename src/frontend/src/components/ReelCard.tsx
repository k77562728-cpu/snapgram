import {
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Share2,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ReelView } from "../backend.d";
import { useAddComment, useToggleLike } from "../hooks/useQueries";
import { CommentPanel } from "./CommentPanel";

interface ReelCardProps {
  reel: ReelView;
  isActive: boolean;
  onWatchTime: (seconds: number) => void;
}

export function ReelCard({ reel, isActive, onWatchTime }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchStartRef = useRef<number | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef(0);

  const toggleLike = useToggleLike();
  const addComment = useAddComment();

  const recordAndStop = useCallback(() => {
    if (watchStartRef.current !== null) {
      const elapsed = Math.floor((Date.now() - watchStartRef.current) / 1000);
      if (elapsed > 0) onWatchTime(elapsed);
      watchStartRef.current = null;
    }
  }, [onWatchTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video
        .play()
        .then(() => {
          setPlaying(true);
          watchStartRef.current = Date.now();
        })
        .catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
      recordAndStop();
    }
    return () => {
      recordAndStop();
    };
  }, [isActive, recordAndStop]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration ?? 0);
  };

  const handleLike = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    toggleLike.mutate({
      reelId: reel.id,
      currentLiked: reel.likedByMe,
      currentCount: reel.likeCount,
    });
  };

  const handleVideoClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!reel.likedByMe) handleLike();
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
    }
    lastTapRef.current = now;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => {
          setPlaying(true);
          watchStartRef.current = Date.now();
        })
        .catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
      recordAndStop();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${reel.username} on Snapgram`,
          text: reel.caption,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!", {
        description: "Share it with your friends 🔗",
      });
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatCount = (n: bigint) => {
    const num = Number(n);
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  return (
    <div className="relative w-full h-full snap-item bg-black flex items-center justify-center overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handleVideoClick}
        onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Double tap heart */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Heart className="w-24 h-24 text-primary fill-primary drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/pause overlay */}
      <AnimatePresence>
        {!playing && isActive && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        <button
          type="button"
          data-ocid="reels.toggle"
          onClick={handleLike}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              reel.likedByMe ? "bg-primary/20" : "bg-black/50 backdrop-blur-sm"
            } ${likeAnimating ? "like-pulse" : ""}`}
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${reel.likedByMe ? "text-primary fill-primary" : "text-white"}`}
            />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            {formatCount(reel.likeCount)}
          </span>
        </button>

        <button
          type="button"
          data-ocid="reels.open_modal_button"
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            {reel.comments.length}
          </span>
        </button>

        <button
          type="button"
          data-ocid="reels.button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            Share
          </span>
        </button>

        <button
          type="button"
          data-ocid="reels.secondary_button"
          onClick={() => setBookmarked(!bookmarked)}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${bookmarked ? "bg-primary/20" : "bg-black/50 hover:bg-white/20"}`}
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${bookmarked ? "text-primary fill-primary" : "text-white"}`}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            {muted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-14 p-4 z-20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
            {reel.username[0]?.toUpperCase()}
          </div>
          <span className="text-white font-semibold text-sm">
            @{reel.username}
          </span>
          <button
            type="button"
            className="ml-1 flex items-center gap-1 text-xs text-white/80 bg-white/15 border border-white/30 rounded-full px-2.5 py-0.5 backdrop-blur-sm hover:bg-white/25 transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            Follow
          </button>
        </div>
        <p className="text-white text-sm leading-snug line-clamp-2 drop-shadow">
          {reel.caption}
        </p>

        <div className="mt-3">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <span>{formatTime((progress / 100) * duration)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <CommentPanel
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        comments={reel.comments}
        onAddComment={(author, text) =>
          addComment.mutate({ reelId: reel.id, author, text })
        }
        isPosting={addComment.isPending}
      />
    </div>
  );
}
