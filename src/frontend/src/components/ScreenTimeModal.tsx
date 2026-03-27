import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Clock, RotateCcw, Shield, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useScreenTimeInfo, useSetScreenTimeLimit } from "../hooks/useQueries";

interface ScreenTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  localUsedSeconds: number;
}

export function ScreenTimeModal({
  isOpen,
  onClose,
  localUsedSeconds,
}: ScreenTimeModalProps) {
  const { data: screenTimeInfo } = useScreenTimeInfo();
  const setLimit = useSetScreenTimeLimit();
  const [limitMinutes, setLimitMinutes] = useState(60);

  const limitSeconds = screenTimeInfo
    ? Number(screenTimeInfo.limitSeconds)
    : 3600;
  const usedSeconds =
    localUsedSeconds +
    (screenTimeInfo ? Number(screenTimeInfo.usedSeconds) : 0);
  const usedMinutes = Math.floor(usedSeconds / 60);
  const limitMins = Math.floor(limitSeconds / 60);
  const progressPct = Math.min(100, (usedSeconds / limitSeconds) * 100);

  useEffect(() => {
    if (screenTimeInfo) {
      setLimitMinutes(Math.floor(Number(screenTimeInfo.limitSeconds) / 60));
    }
  }, [screenTimeInfo]);

  const handleSave = () => {
    setLimit.mutate(limitMinutes);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            data-ocid="screentime.modal"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#111827] border border-border p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Screen Time
                </h2>
              </div>
              <button
                type="button"
                data-ocid="screentime.close_button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mb-6 p-4 rounded-xl bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Today's Watch Time
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {usedMinutes}
                <span className="text-base font-normal text-muted-foreground ml-1">
                  / {limitMins} min
                </span>
              </div>
              <Progress value={progressPct} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progressPct >= 100
                  ? "Daily limit reached!"
                  : `${Math.round(100 - progressPct)}% remaining`}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Daily Limit
                </span>
                <span className="text-sm font-bold text-primary">
                  {limitMinutes} min
                </span>
              </div>
              <Slider
                data-ocid="screentime.select"
                min={10}
                max={240}
                step={10}
                value={[limitMinutes]}
                onValueChange={([v]) => setLimitMinutes(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10 min</span>
                <span>4 hrs</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted"
                onClick={onClose}
                data-ocid="screentime.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={handleSave}
                data-ocid="screentime.save_button"
              >
                Save Limit
              </Button>
            </div>

            <button
              type="button"
              data-ocid="screentime.delete_button"
              className="mt-3 w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
              onClick={onClose}
            >
              <RotateCcw className="w-3 h-3" />
              Reset today's watch time
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
