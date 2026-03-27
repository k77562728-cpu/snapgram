import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Story } from "../backend.d";
import { useCreateStory, useGetStories } from "../hooks/useQueries";
import { useStorageUpload } from "../hooks/useStorageUpload";

interface StoriesRowProps {
  username: string;
}

export function StoriesRow({ username }: StoriesRowProps) {
  const { data: stories = [] } = useGetStories();
  const createStory = useCreateStory();
  const { uploadFile } = useStorageUpload();
  const [addOpen, setAddOpen] = useState(false);
  const [viewStory, setViewStory] = useState<Story | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !username) return;
    setIsUploading(true);
    try {
      const imageUrl = await uploadFile(file, setUploadProgress);
      await createStory.mutateAsync({ imageUrl, username });
      setAddOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const closeViewer = () => setViewStory(null);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          data-ocid="stories.open_modal_button"
          onClick={() => setAddOpen(true)}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className="w-14 h-14 rounded-full bg-secondary border-2 border-dashed border-primary/60 flex items-center justify-center">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground w-14 text-center truncate">
            Add Story
          </span>
        </button>

        {stories.map((story, i) => (
          <button
            key={Number(story.id)}
            type="button"
            data-ocid={`stories.item.${i + 1}`}
            onClick={() => setViewStory(story)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="w-14 h-14 rounded-full p-[2px] gradient-brand">
              <div className="w-full h-full rounded-full overflow-hidden bg-background">
                <Avatar className="w-full h-full">
                  <AvatarImage
                    src={story.imageUrl}
                    alt={story.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="gradient-brand text-white text-sm font-bold">
                    {story.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[10px] text-foreground/80 w-14 text-center truncate">
              @{story.username}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="stories.dialog"
        >
          <DialogTitle className="text-foreground">Add Story</DialogTitle>
          <div className="flex flex-col gap-4">
            {isUploading ? (
              <div data-ocid="stories.loading_state" className="space-y-2">
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="gradient-brand h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Select an image to share as your story.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  data-ocid="stories.upload_button"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition-colors flex flex-col items-center gap-2 text-muted-foreground"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">Choose Image</span>
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {viewStory && (
        <button
          type="button"
          data-ocid="stories.modal"
          className="fixed inset-0 z-50 bg-black flex items-center justify-center w-full border-0 cursor-default"
          onClick={closeViewer}
        >
          <button
            type="button"
            data-ocid="stories.close_button"
            onClick={(e) => {
              e.stopPropagation();
              closeViewer();
            }}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-6 left-4 z-10 flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-primary">
              <AvatarImage src={viewStory.imageUrl} />
              <AvatarFallback className="gradient-brand text-white text-xs">
                {viewStory.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-semibold">
              @{viewStory.username}
            </span>
          </div>
          <button
            type="button"
            className="border-0 bg-transparent p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewStory.imageUrl}
              alt={viewStory.username}
              className="max-w-full max-h-full object-contain"
            />
          </button>
        </button>
      )}
    </>
  );
}
