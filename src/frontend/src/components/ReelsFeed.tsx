import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGetReels,
  useRecordWatchTime,
  useScreenTimeInfo,
} from "../hooks/useQueries";
import { ReelCard } from "./ReelCard";
import { ScreenTimeWarning } from "./ScreenTimeWarning";

interface ReelsFeedProps {
  onOpenScreenTime: () => void;
  /** Extra pixels already consumed above the feed (e.g. stories row). Default 0. */
  heightOffset?: number;
}

export function ReelsFeed({
  onOpenScreenTime,
  heightOffset = 0,
}: ReelsFeedProps) {
  const { data: reels, isLoading } = useGetReels();
  const { data: screenTimeInfo } = useScreenTimeInfo();
  const recordWatchTime = useRecordWatchTime();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [localWatchSeconds, setLocalWatchSeconds] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const handleWatchTime = useCallback(
    (seconds: number) => {
      setLocalWatchSeconds((prev) => prev + seconds);
      recordWatchTime.mutate(seconds);
    },
    [recordWatchTime],
  );

  useEffect(() => {
    if (!screenTimeInfo || warningDismissed) return;
    const limit = Number(screenTimeInfo.limitSeconds);
    const used = Number(screenTimeInfo.usedSeconds) + localWatchSeconds;
    if (limit > 0 && used >= limit) {
      setShowWarning(true);
    }
  }, [screenTimeInfo, localWatchSeconds, warningDismissed]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reels triggers re-render updating container children
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = children.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    for (const child of children) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [reels]);

  const feedHeight = `calc(100vh - ${112 + heightOffset}px)`;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="space-y-3 w-full max-w-sm px-4">
          <Skeleton className="h-[60vh] w-full rounded-2xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        data-ocid="reels.list"
        className="snap-container w-full"
        style={{ height: feedHeight }}
      >
        {(reels ?? []).map((reel, i) => (
          <div
            key={Number(reel.id)}
            data-ocid={`reels.item.${i + 1}`}
            className="snap-item w-full"
            style={{ height: feedHeight }}
          >
            <ReelCard
              reel={reel}
              isActive={i === activeIndex}
              onWatchTime={handleWatchTime}
            />
          </div>
        ))}
      </div>

      <ScreenTimeWarning
        isVisible={showWarning && !warningDismissed}
        onDismiss={() => {
          setShowWarning(false);
          setWarningDismissed(true);
        }}
        onOpenSettings={() => {
          setShowWarning(false);
          onOpenScreenTime();
        }}
      />
    </>
  );
}
