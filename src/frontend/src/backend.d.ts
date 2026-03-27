import { ActorMethod } from "@dfinity/agent";

export interface Comment {
  id: bigint;
  author: string;
  text: string;
  timestamp: bigint;
}

export interface ReelView {
  id: bigint;
  videoUrl: string;
  username: string;
  caption: string;
  likeCount: bigint;
  comments: Comment[];
  likedByMe: boolean;
}

export interface Story {
  id: bigint;
  imageUrl: string;
  username: string;
  timestamp: bigint;
}

export interface Message {
  id: bigint;
  fromUser: string;
  toUser: string;
  text: string;
  timestamp: bigint;
}

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
}

export interface ScreenTimeInfo {
  usedSeconds: bigint;
  limitSeconds: bigint;
}

export interface _SERVICE {
  // Reels
  getReels: ActorMethod<[], ReelView[]>;
  createReel: ActorMethod<[string, string, string], bigint>;
  toggleLike: ActorMethod<[bigint], bigint>;
  addComment: ActorMethod<[bigint, string, string], boolean>;
  // Stories
  getStories: ActorMethod<[], Story[]>;
  createStory: ActorMethod<[string, string], bigint>;
  // Messaging
  sendMessage: ActorMethod<[string, string, string], bigint>;
  getMessages: ActorMethod<[string, string], Message[]>;
  getConversations: ActorMethod<[string], string[]>;
  // Profile
  setProfile: ActorMethod<[string, string, string, string], undefined>;
  getMyProfile: ActorMethod<[], [] | [UserProfile]>;
  // Screen Time
  recordWatchTime: ActorMethod<[bigint], undefined>;
  setScreenTimeLimit: ActorMethod<[bigint], undefined>;
  getScreenTimeInfo: ActorMethod<[], ScreenTimeInfo>;
  resetDailyScreenTime: ActorMethod<[], undefined>;
  // Auth
  getCallerUserRole: ActorMethod<[], { admin: null } | { user: null } | { guest: null }>;
  isCallerAdmin: ActorMethod<[], boolean>;
  _initializeAccessControlWithSecret: ActorMethod<[string], undefined>;
}
