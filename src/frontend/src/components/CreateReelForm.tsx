import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Film, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useCreateReel } from "../hooks/useQueries";
import { useStorageUpload } from "../hooks/useStorageUpload";

interface CreateReelFormProps {
  username: string;
  onSuccess: () => void;
}

export function CreateReelForm({ username, onSuccess }: CreateReelFormProps) {
  const [caption, setCaption] = useState("");
  const [authorName, setAuthorName] = useState(username || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving" | "done">(
    "idle",
  );
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const createReel = useCreateReel();
  const { uploadFile } = useStorageUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setVideoFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }
    if (!authorName.trim()) {
      setError("Please enter a username.");
      return;
    }
    setError("");
    try {
      setPhase("uploading");
      const videoUrl = await uploadFile(videoFile, setUploadProgress);
      setPhase("saving");
      await createReel.mutateAsync({
        videoUrl,
        username: authorName.trim(),
        caption,
      });
      setPhase("done");
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      setError(err?.message ?? "Upload failed. Please try again.");
      setPhase("idle");
    }
  };

  if (phase === "done") {
    return (
      <div
        data-ocid="create.success_state"
        className="flex flex-col items-center justify-center gap-4 h-full text-center p-8"
      >
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Reel Posted!</h2>
        <p className="text-muted-foreground text-sm">Redirecting to Reels...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Film className="w-5 h-5 text-primary" />
        Create a Reel
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Video file pick */}
        <div>
          <button
            type="button"
            data-ocid="create.dropzone"
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground bg-card/40"
          >
            {videoFile ? (
              <>
                <Film className="w-10 h-10 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {videoFile.name}
                </span>
                <span className="text-xs">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10" />
                <span className="text-sm">Tap to select a video</span>
                <span className="text-xs">MP4, MOV, WebM supported</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            id="create-video-input"
            data-ocid="create.upload_button"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label
            htmlFor="create-username"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            Username
          </label>
          <input
            id="create-username"
            type="text"
            data-ocid="create.input"
            placeholder="@your_username"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <label
            htmlFor="create-caption"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            Caption
          </label>
          <Textarea
            id="create-caption"
            data-ocid="create.textarea"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="bg-secondary/60 border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Upload progress */}
        {(phase === "uploading" || phase === "saving") && (
          <div data-ocid="create.loading_state" className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {phase === "uploading"
                  ? "Uploading video..."
                  : "Saving reel..."}
              </span>
              <span>{phase === "uploading" ? `${uploadProgress}%` : ""}</span>
            </div>
            <Progress
              value={phase === "uploading" ? uploadProgress : 90}
              className="h-1.5"
            />
          </div>
        )}

        {error && (
          <p
            data-ocid="create.error_state"
            className="text-destructive text-sm"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          data-ocid="create.submit_button"
          disabled={phase === "uploading" || phase === "saving"}
          className="w-full gradient-brand text-white font-semibold py-3 rounded-xl border-0"
        >
          {phase === "uploading"
            ? "Uploading..."
            : phase === "saving"
              ? "Saving..."
              : "Post Reel"}
        </Button>
      </form>
    </div>
  );
}
