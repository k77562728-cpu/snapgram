import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ScreenTimeWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
  onOpenSettings: () => void;
}

export function ScreenTimeWarning({
  isVisible,
  onDismiss,
  onOpenSettings,
}: ScreenTimeWarningProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-ocid="screentime.modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center px-8 py-10 rounded-3xl bg-[#0F172A] border border-primary/30 max-w-xs mx-4 shadow-glow"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Time's Up! ⏱️
            </h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              You've reached your daily screen time limit. Take a break and come
              back later!
            </p>
            <div className="space-y-3">
              <Button
                data-ocid="screentime.confirm_button"
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold"
                onClick={onOpenSettings}
              >
                Update Limit
              </Button>
              <Button
                data-ocid="screentime.cancel_button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                Dismiss for now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
