import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Message,
  ReelView,
  ScreenTimeInfo,
  Story,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

const SAMPLE_REELS: ReelView[] = [
  {
    id: BigInt(1),
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    username: "alex_travels",
    caption:
      "🔥 Chasing fire and light across the horizon — pure magic! #travel #adventure #reels",
    likeCount: BigInt(342),
    comments: [
      {
        id: BigInt(1),
        author: "wanderlust99",
        text: "This is absolutely stunning! 😍",
        timestamp: BigInt(1700000001),
      },
      {
        id: BigInt(2),
        author: "fire_chaser",
        text: "Where was this shot?? 🔥",
        timestamp: BigInt(1700000002),
      },
    ],
    likedByMe: false,
  },
  {
    id: BigInt(2),
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    username: "creative_minds",
    caption: "✨ Dreams are made of light and imagination. #animation #art",
    likeCount: BigInt(891),
    comments: [
      {
        id: BigInt(3),
        author: "pixelartist",
        text: "Blender open movie classic! 🎬",
        timestamp: BigInt(1700000003),
      },
    ],
    likedByMe: false,
  },
  {
    id: BigInt(3),
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    username: "nature_lover",
    caption: "🐰 A big buck bunny vibing in the forest 🌲 #nature #cute",
    likeCount: BigInt(1247),
    comments: [],
    likedByMe: true,
  },
  {
    id: BigInt(4),
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    username: "adventure_seeker",
    caption:
      "🚗 Off-road and off-grid — road trip season is HERE! #cars #adventure",
    likeCount: BigInt(567),
    comments: [],
    likedByMe: false,
  },
  {
    id: BigInt(5),
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    username: "tech_vibes",
    caption: "🤖 When sci-fi meets reality. #scifi #tech",
    likeCount: BigInt(2103),
    comments: [],
    likedByMe: false,
  },
];

export function useGetReels() {
  const { actor, isFetching } = useActor();
  return useQuery<ReelView[]>({
    queryKey: ["reels"],
    queryFn: async (): Promise<ReelView[]> => {
      if (!actor) return SAMPLE_REELS;
      try {
        const a = actor as any;
        const reels: ReelView[] = await a.getReels();
        return reels.length > 0 ? reels : SAMPLE_REELS;
      } catch {
        return SAMPLE_REELS;
      }
    },
    enabled: !isFetching,
    initialData: SAMPLE_REELS,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reelId,
      currentLiked,
      currentCount,
    }: { reelId: bigint; currentLiked: boolean; currentCount: bigint }) => {
      if (!actor) {
        return {
          newCount: currentLiked
            ? currentCount - BigInt(1)
            : currentCount + BigInt(1),
          liked: !currentLiked,
        };
      }
      try {
        const a = actor as any;
        const newCount: bigint = await a.toggleLike(reelId);
        return { newCount, liked: !currentLiked };
      } catch {
        return {
          newCount: currentLiked
            ? currentCount - BigInt(1)
            : currentCount + BigInt(1),
          liked: !currentLiked,
        };
      }
    },
    onMutate: async ({ reelId, currentLiked, currentCount }) => {
      await queryClient.cancelQueries({ queryKey: ["reels"] });
      const previous = queryClient.getQueryData<ReelView[]>(["reels"]);
      queryClient.setQueryData<ReelView[]>(
        ["reels"],
        (old) =>
          old?.map((r) =>
            r.id === reelId
              ? {
                  ...r,
                  likedByMe: !currentLiked,
                  likeCount: currentLiked
                    ? currentCount - BigInt(1)
                    : currentCount + BigInt(1),
                }
              : r,
          ) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["reels"], ctx.previous);
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reelId,
      author,
      text,
    }: { reelId: bigint; author: string; text: string }) => {
      if (!actor) return true;
      try {
        const a = actor as any;
        return await a.addComment(reelId, author, text);
      } catch {
        return true;
      }
    },
    onSuccess: (_data, { reelId, author, text }) => {
      queryClient.setQueryData<ReelView[]>(
        ["reels"],
        (old) =>
          old?.map((r) =>
            r.id === reelId
              ? {
                  ...r,
                  comments: [
                    ...r.comments,
                    {
                      id: BigInt(Date.now()),
                      author,
                      text,
                      timestamp: BigInt(Math.floor(Date.now() / 1000)),
                    },
                  ],
                }
              : r,
          ) ?? [],
      );
    },
  });
}

export function useCreateReel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      videoUrl,
      username,
      caption,
    }: { videoUrl: string; username: string; caption: string }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      return (await a.createReel(videoUrl, username, caption)) as bigint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}

export function useGetStories() {
  const { actor, isFetching } = useActor();
  return useQuery<Story[]>({
    queryKey: ["stories"],
    queryFn: async (): Promise<Story[]> => {
      if (!actor) return [];
      try {
        const a = actor as any;
        return (await a.getStories()) as Story[];
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
    refetchInterval: 15000,
    initialData: [],
  });
}

export function useCreateStory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      imageUrl,
      username,
    }: { imageUrl: string; username: string }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      return (await a.createStory(imageUrl, username)) as bigint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useGetConversations(username: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["conversations", username],
    queryFn: async (): Promise<string[]> => {
      if (!actor || !username) return [];
      try {
        const a = actor as any;
        return (await a.getConversations(username)) as string[];
      } catch {
        return [];
      }
    },
    enabled: !isFetching && !!username,
    refetchInterval: 10000,
    initialData: [],
  });
}

export function useGetMessages(user1: string, user2: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", user1, user2],
    queryFn: async (): Promise<Message[]> => {
      if (!actor || !user1 || !user2) return [];
      try {
        const a = actor as any;
        return (await a.getMessages(user1, user2)) as Message[];
      } catch {
        return [];
      }
    },
    enabled: !isFetching && !!user1 && !!user2,
    refetchInterval: 5000,
    initialData: [],
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fromUser,
      toUser,
      text,
    }: { fromUser: string; toUser: string; text: string }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      return (await a.sendMessage(fromUser, toUser, text)) as bigint;
    },
    onSuccess: (_data, { fromUser, toUser }) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", fromUser, toUser],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", toUser, fromUser],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useGetMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!actor) return null;
      try {
        const a = actor as any;
        const result: [] | [UserProfile] = await a.getMyProfile();
        if (result.length > 0 && result[0] != null) {
          return result[0] as UserProfile;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !isFetching,
    initialData: null,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      username,
      bio,
      avatarUrl,
    }: { name: string; username: string; bio: string; avatarUrl: string }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      await a.setProfile(name, username, bio, avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useScreenTimeInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<ScreenTimeInfo>({
    queryKey: ["screenTime"],
    queryFn: async () => {
      if (!actor) return { usedSeconds: BigInt(0), limitSeconds: BigInt(3600) };
      try {
        const a = actor as any;
        return (await a.getScreenTimeInfo()) as ScreenTimeInfo;
      } catch {
        return { usedSeconds: BigInt(0), limitSeconds: BigInt(3600) };
      }
    },
    enabled: !isFetching,
    refetchInterval: 30000,
  });
}

export function useSetScreenTimeLimit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (minutes: number) => {
      if (!actor) return;
      try {
        const a = actor as any;
        await a.setScreenTimeLimit(BigInt(minutes * 60));
      } catch {
        // ignore
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screenTime"] });
    },
  });
}

export function useRecordWatchTime() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (seconds: number) => {
      if (!actor) return;
      try {
        const a = actor as any;
        await a.recordWatchTime(BigInt(seconds));
      } catch {
        // ignore
      }
    },
  });
}
