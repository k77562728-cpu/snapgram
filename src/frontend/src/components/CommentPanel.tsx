import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Comment } from "../backend.d";

interface CommentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (author: string, text: string) => void;
  isPosting?: boolean;
}

export function CommentPanel({
  isOpen,
  onClose,
  comments,
  onAddComment,
  isPosting,
}: CommentPanelProps) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("You");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(author || "You", trimmed);
    setText("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            data-ocid="comments.panel"
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-[#111827] border-t border-border max-h-[70vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground text-base">
                  {comments.length} Comments
                </span>
              </div>
              <button
                type="button"
                data-ocid="comments.close_button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <ScrollArea className="flex-1 px-5 overflow-auto">
              {comments.length === 0 ? (
                <div
                  data-ocid="comments.empty_state"
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No comments yet. Be the first!
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {comments.map((c, i) => (
                    <div
                      key={Number(c.id)}
                      data-ocid={`comments.item.${i + 1}`}
                      className="flex gap-3"
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {c.author[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">
                          {c.author}
                        </p>
                        <p className="text-sm text-foreground/90 mt-0.5 break-words">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border space-y-2">
              <Input
                placeholder="Your name (optional)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-input border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  data-ocid="comments.input"
                  placeholder="Add a comment..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  type="button"
                  data-ocid="comments.submit_button"
                  size="icon"
                  onClick={handleSubmit}
                  disabled={!text.trim() || isPosting}
                  className="bg-primary hover:bg-primary/80 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
