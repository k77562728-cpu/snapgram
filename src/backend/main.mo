import AccessControl "authorization/access-control";
import AuthMixin "authorization/MixinAuthorization";
import BlobMixin "blob-storage/Mixin";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";

actor {
  // ---- Authorization ----
  let _accessControlState = AccessControl.initState();
  include AuthMixin(_accessControlState);

  // ---- Blob Storage ----
  include BlobMixin();

  // ---- Types ----
  type Comment = {
    id : Nat;
    author : Text;
    text : Text;
    timestamp : Int;
  };

  type Reel = {
    id : Nat;
    videoUrl : Text;
    username : Text;
    caption : Text;
    var likeCount : Nat;
    var comments : [Comment];
  };

  type ReelView = {
    id : Nat;
    videoUrl : Text;
    username : Text;
    caption : Text;
    likeCount : Nat;
    comments : [Comment];
    likedByMe : Bool;
  };

  type Story = {
    id : Nat;
    imageUrl : Text;
    username : Text;
    timestamp : Int;
  };

  type Message = {
    id : Nat;
    fromUser : Text;
    toUser : Text;
    text : Text;
    timestamp : Int;
  };

  type UserProfile = {
    name : Text;
    username : Text;
    bio : Text;
    avatarUrl : Text;
  };

  // ---- State ----
  var nextReelId : Nat = 0;
  var nextCommentId : Nat = 0;
  var nextStoryId : Nat = 0;
  var nextMessageId : Nat = 0;

  let reels = Map.empty<Nat, Reel>();
  let userLikes = Map.empty<Text, Bool>();
  let userScreenTime = Map.empty<Principal, Nat>();
  let userScreenLimit = Map.empty<Principal, Nat>();
  let stories = Map.empty<Nat, Story>();
  let messages = Map.empty<Nat, Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ---- Seed Data ----
  func seedReels() {
    let samples : [(Text, Text, Text, Nat)] = [
      ("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "alex_travels", "Exploring the world one city at a time #travel #reels", 342),
      ("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", "creative_minds", "Dreams are made of moments like these #dreamy #vibes", 891),
      ("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "nature_lover", "When nature puts on a show #nature #beautiful", 1247),
      ("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", "adventure_seeker", "Life is an adventure, live it fully #adventure #life", 567),
      ("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", "tech_vibes", "The future is now #tech #future #trending", 2103)
    ];
    for ((url, user, cap, likes) in samples.vals()) {
      let id = nextReelId;
      nextReelId += 1;
      let reel : Reel = {
        id;
        videoUrl = url;
        username = user;
        caption = cap;
        var likeCount = likes;
        var comments = [];
      };
      reels.add(id, reel);
    };
  };

  func seedStories() {
    let samples : [(Text, Text)] = [
      ("https://picsum.photos/seed/story1/400/700", "alex_travels"),
      ("https://picsum.photos/seed/story2/400/700", "creative_minds"),
      ("https://picsum.photos/seed/story3/400/700", "nature_lover"),
      ("https://picsum.photos/seed/story4/400/700", "adventure_seeker")
    ];
    for ((url, user) in samples.vals()) {
      let id = nextStoryId;
      nextStoryId += 1;
      let story : Story = { id; imageUrl = url; username = user; timestamp = Time.now() };
      stories.add(id, story);
    };
  };

  seedReels();
  seedStories();

  // ---- Reel Queries ----
  public query ({ caller }) func getReels() : async [ReelView] {
    let callerKey = caller.toText();
    reels.toArray().map<(Nat, Reel), ReelView>(func((_, r)) {
      let likedKey = callerKey # ":" # r.id.toText();
      let liked = switch (userLikes.get(likedKey)) {
        case (?v) v;
        case null false;
      };
      { id = r.id; videoUrl = r.videoUrl; username = r.username; caption = r.caption; likeCount = r.likeCount; comments = r.comments; likedByMe = liked };
    });
  };

  public shared ({ caller = _ }) func createReel(videoUrl : Text, username : Text, caption : Text) : async Nat {
    let id = nextReelId;
    nextReelId += 1;
    let reel : Reel = {
      id;
      videoUrl;
      username;
      caption;
      var likeCount = 0;
      var comments = [];
    };
    reels.add(id, reel);
    id;
  };

  public shared ({ caller }) func toggleLike(reelId : Nat) : async Nat {
    let callerKey = caller.toText();
    let likedKey = callerKey # ":" # reelId.toText();
    switch (reels.get(reelId)) {
      case null { 0 };
      case (?reel) {
        let wasLiked = switch (userLikes.get(likedKey)) {
          case (?v) v;
          case null false;
        };
        if (wasLiked) {
          reel.likeCount -= 1;
          userLikes.add(likedKey, false);
        } else {
          reel.likeCount += 1;
          userLikes.add(likedKey, true);
        };
        reel.likeCount;
      };
    };
  };

  public shared ({ caller = _ }) func addComment(reelId : Nat, author : Text, text : Text) : async Bool {
    switch (reels.get(reelId)) {
      case null { false };
      case (?reel) {
        let comment : Comment = {
          id = nextCommentId;
          author;
          text;
          timestamp = Time.now();
        };
        nextCommentId += 1;
        reel.comments := reel.comments.concat([comment]);
        true;
      };
    };
  };

  // ---- Stories ----
  public query func getStories() : async [Story] {
    stories.toArray().map<(Nat, Story), Story>(func((_, s)) { s });
  };

  public shared ({ caller = _ }) func createStory(imageUrl : Text, username : Text) : async Nat {
    let id = nextStoryId;
    nextStoryId += 1;
    let story : Story = { id; imageUrl; username; timestamp = Time.now() };
    stories.add(id, story);
    id;
  };

  // ---- Messaging ----
  public shared ({ caller = _ }) func sendMessage(fromUser : Text, toUser : Text, text : Text) : async Nat {
    let id = nextMessageId;
    nextMessageId += 1;
    let msg : Message = { id; fromUser; toUser; text; timestamp = Time.now() };
    messages.add(id, msg);
    id;
  };

  public query func getMessages(user1 : Text, user2 : Text) : async [Message] {
    messages.toArray()
      .filter<(Nat, Message)>(func((_, m)) {
        (m.fromUser == user1 and m.toUser == user2) or
        (m.fromUser == user2 and m.toUser == user1)
      })
      .map<(Nat, Message), Message>(func((_, m)) { m });
  };

  public query func getConversations(username : Text) : async [Text] {
    let seen = Map.empty<Text, Bool>();
    let allMsgs = messages.toArray();
    let relevant = allMsgs.filter(func((_, m) : (Nat, Message)) : Bool {
      m.fromUser == username or m.toUser == username
    });
    let partners = relevant.map(func((_, m) : (Nat, Message)) : Text {
      if (m.fromUser == username) { m.toUser } else { m.fromUser }
    });
    partners.filter(func(u : Text) : Bool {
      if (seen.get(u) == null) {
        seen.add(u, true);
        true;
      } else { false };
    });
  };

  // ---- User Profiles ----
  public shared ({ caller }) func setProfile(name : Text, username : Text, bio : Text, avatarUrl : Text) : async () {
    let profile : UserProfile = { name; username; bio; avatarUrl };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  // ---- Screen Time ----
  public shared ({ caller }) func recordWatchTime(seconds : Nat) : async () {
    let current = switch (userScreenTime.get(caller)) {
      case (?v) v;
      case null 0;
    };
    userScreenTime.add(caller, current + seconds);
  };

  public shared ({ caller }) func setScreenTimeLimit(minutes : Nat) : async () {
    userScreenLimit.add(caller, minutes * 60);
  };

  public query ({ caller }) func getScreenTimeInfo() : async { usedSeconds : Nat; limitSeconds : Nat } {
    let used = switch (userScreenTime.get(caller)) {
      case (?v) v;
      case null 0;
    };
    let limit = switch (userScreenLimit.get(caller)) {
      case (?v) v;
      case null 3600;
    };
    { usedSeconds = used; limitSeconds = limit };
  };

  public shared ({ caller }) func resetDailyScreenTime() : async () {
    userScreenTime.add(caller, 0);
  };
}
