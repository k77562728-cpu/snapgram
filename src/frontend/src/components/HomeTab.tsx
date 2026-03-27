import { ReelsFeed } from "./ReelsFeed";
import { StoriesRow } from "./StoriesRow";

interface HomeTabProps {
  username: string;
  onOpenScreenTime: () => void;
}

export function HomeTab({ username, onOpenScreenTime }: HomeTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Stories strip */}
      <div className="border-b border-border/40 bg-[#0F172A]/80 shrink-0">
        <StoriesRow username={username} />
      </div>
      {/* Reels below stories */}
      <div className="flex-1 overflow-hidden">
        <ReelsFeed onOpenScreenTime={onOpenScreenTime} heightOffset={210} />
      </div>
    </div>
  );
}
