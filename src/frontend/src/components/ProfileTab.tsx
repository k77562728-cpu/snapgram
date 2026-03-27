import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Film } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGetMyProfile,
  useGetReels,
  useSetProfile,
} from "../hooks/useQueries";

interface ProfileTabProps {
  username: string;
  onUsernameChange: (u: string) => void;
}

export function ProfileTab({ username, onUsernameChange }: ProfileTabProps) {
  const { data: profile, isLoading } = useGetMyProfile();
  const { data: allReels = [] } = useGetReels();
  const setProfileMutation = useSetProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    avatarUrl: "",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only when profile/isLoading change
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      });
      if (profile.username && profile.username !== username) {
        onUsernameChange(profile.username);
      }
    } else if (!profile && !isLoading) {
      setEditing(true);
      setForm({ name: "", username, bio: "", avatarUrl: "" });
    }
  }, [profile, isLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await setProfileMutation.mutateAsync(form);
    onUsernameChange(form.username);
    setEditing(false);
  };

  const myReels = allReels.filter(
    (r) => r.username === (profile?.username || username),
  );

  const displayName = profile?.name || username || "Your Name";
  const displayUsername = profile?.username || username || "your_username";
  const displayBio = profile?.bio || "";
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  if (isLoading) {
    return (
      <div data-ocid="profile.loading_state" className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {!editing ? (
          <>
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0">
                {profile?.avatarUrl ? (
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatarUrl} alt={displayName} />
                    <AvatarFallback className="gradient-brand text-white text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground">
                  {displayName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{displayUsername}
                </p>
                {displayBio && (
                  <p className="text-sm text-foreground/80 mt-1.5">
                    {displayBio}
                  </p>
                )}
              </div>
            </div>

            <Button
              data-ocid="profile.edit_button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(true);
                setForm({
                  name: profile?.name ?? "",
                  username: profile?.username ?? username,
                  bio: profile?.bio ?? "",
                  avatarUrl: profile?.avatarUrl ?? "",
                });
              }}
              className="mb-6 border-border text-foreground hover:bg-secondary"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit Profile
            </Button>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { val: myReels.length.toString(), label: "Reels" },
                { val: "1.2k", label: "Followers" },
                { val: "348", label: "Following" },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="text-center p-3 rounded-xl bg-card/60 border border-border"
                >
                  <div className="text-lg font-bold text-primary">{val}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {myReels.length > 0 ? (
              <div data-ocid="profile.list" className="grid grid-cols-3 gap-1">
                {myReels.map((reel, i) => (
                  <div
                    key={Number(reel.id)}
                    data-ocid={`profile.item.${i + 1}`}
                    className="aspect-square rounded-sm bg-card/60 border border-border flex items-center justify-center relative overflow-hidden"
                  >
                    <video
                      src={reel.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-end p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-white text-[9px] truncate">
                        {reel.caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                data-ocid="profile.empty_state"
                className="grid grid-cols-3 gap-1"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={`empty-${i + 1}`}
                    className="aspect-square rounded-sm bg-card/60 border border-border flex items-center justify-center"
                  >
                    <Film className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <form
            data-ocid="profile.panel"
            onSubmit={handleSave}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold text-foreground mb-2">
              {profile ? "Edit Profile" : "Set Up Your Profile"}
            </h2>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-name"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                data-ocid="profile.input"
                placeholder="Your display name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-username"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Username
              </label>
              <input
                id="profile-username"
                type="text"
                data-ocid="profile.input"
                placeholder="@username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-bio"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Bio
              </label>
              <Textarea
                id="profile-bio"
                data-ocid="profile.textarea"
                placeholder="Tell the world about yourself..."
                value={form.bio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
                rows={2}
                className="bg-secondary/60 border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-avatar"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Avatar URL (optional)
              </label>
              <input
                id="profile-avatar"
                type="url"
                data-ocid="profile.input"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avatarUrl: e.target.value }))
                }
                className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {setProfileMutation.isError && (
              <p
                data-ocid="profile.error_state"
                className="text-destructive text-sm"
              >
                Failed to save profile. Please try again.
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                data-ocid="profile.save_button"
                disabled={setProfileMutation.isPending}
                className="flex-1 gradient-brand text-white border-0"
              >
                {setProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
              {profile && (
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="profile.cancel_button"
                  onClick={() => setEditing(false)}
                  className="border-border text-foreground hover:bg-secondary"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
