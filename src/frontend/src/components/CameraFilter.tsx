import {
  Download,
  Pen,
  RefreshCw,
  Send,
  Smile,
  StickerIcon,
  Type,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Filter {
  id: string;
  name: string;
  css: string;
  color: string;
  gradient: string;
}

const FILTERS: Filter[] = [
  {
    id: "normal",
    name: "Normal",
    css: "none",
    color: "#888",
    gradient: "linear-gradient(135deg, #555 0%, #999 100%)",
  },
  {
    id: "vivid",
    name: "Vivid",
    css: "saturate(150%) brightness(110%)",
    color: "#e53e3e",
    gradient: "linear-gradient(135deg, #f6416c 0%, #ffcd3c 100%)",
  },
  {
    id: "noir",
    name: "Noir",
    css: "grayscale(100%) contrast(120%)",
    color: "#2d3748",
    gradient: "linear-gradient(135deg, #000 0%, #555 100%)",
  },
  {
    id: "warm",
    name: "Warm",
    css: "sepia(40%) saturate(120%)",
    color: "#dd6b20",
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  },
  {
    id: "cool",
    name: "Cool",
    css: "hue-rotate(200deg) saturate(90%)",
    color: "#3182ce",
    gradient: "linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)",
  },
  {
    id: "fade",
    name: "Fade",
    css: "brightness(110%) contrast(85%) saturate(80%)",
    color: "#a0aec0",
    gradient: "linear-gradient(135deg, #bdc3c7 0%, #e8e8e8 100%)",
  },
  {
    id: "dramatic",
    name: "Dramatic",
    css: "contrast(140%) saturate(130%)",
    color: "#6b46c1",
    gradient: "linear-gradient(135deg, #6b46c1 0%, #e040fb 100%)",
  },
  {
    id: "vintage",
    name: "Vintage",
    css: "sepia(60%) contrast(110%)",
    color: "#b7791f",
    gradient: "linear-gradient(135deg, #b7791f 0%, #f6d365 100%)",
  },
];

interface CameraFilterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CameraFilter({ isOpen, onClose }: CameraFilterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const filterStripRef = useRef<HTMLDivElement>(null);

  const [activeFilterIdx, setActiveFilterIdx] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [filterLabelVisible, setFilterLabelVisible] = useState(false);
  const filterLabelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilter = FILTERS[activeFilterIdx];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Camera access denied or not available.");
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setActiveFilterIdx(0);
    }
    return () => {
      if (!isOpen) stopCamera();
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  const changeFilter = (idx: number) => {
    setActiveFilterIdx(idx);
    // Show filter label briefly
    setFilterLabelVisible(true);
    if (filterLabelTimeout.current) clearTimeout(filterLabelTimeout.current);
    filterLabelTimeout.current = setTimeout(
      () => setFilterLabelVisible(false),
      1400,
    );
    // Scroll filter strip
    const strip = filterStripRef.current;
    if (strip) {
      const btn = strip.children[idx] as HTMLElement;
      if (btn) {
        btn.scrollIntoView({
          inline: "center",
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = activeFilter.css;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setTimeout(() => {
      setCapturedImage(dataUrl);
      stopCamera();
    }, 150);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSave = () => {
    if (!capturedImage) return;
    const a = document.createElement("a");
    a.href = capturedImage;
    a.download = `snapgram-photo-${Date.now()}.png`;
    a.click();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-ocid="camera.modal"
          className="fixed inset-0 z-50 bg-black overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ===== CAMERA VIEW ===== */}
          {!capturedImage && (
            <>
              {/* Fullscreen video */}
              {cameraError ? (
                <div
                  data-ocid="camera.error_state"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8"
                >
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-3xl">📷</span>
                  </div>
                  <p className="text-white/80 text-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: activeFilter.css,
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />
              )}

              {/* Flash overlay */}
              <AnimatePresence>
                {isFlashing && (
                  <motion.div
                    className="absolute inset-0 bg-white pointer-events-none z-30"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Filter name label — center, fades in/out */}
              <AnimatePresence>
                {filterLabelVisible && (
                  <motion.div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span
                      className="px-5 py-2 rounded-full text-white text-base font-semibold tracking-wide"
                      style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {activeFilter.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top overlay buttons */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-start justify-between px-4 pt-10 pb-4">
                {/* X close */}
                <button
                  type="button"
                  data-ocid="camera.close_button"
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))" }}
                >
                  <X className="w-7 h-7 text-white" strokeWidth={2.5} />
                </button>

                {/* Flip camera */}
                <button
                  type="button"
                  data-ocid="camera.toggle"
                  onClick={() =>
                    setFacingMode((f) =>
                      f === "user" ? "environment" : "user",
                    )
                  }
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))" }}
                >
                  <RefreshCw className="w-6 h-6 text-white" strokeWidth={2.5} />
                </button>
              </div>

              {/* Bottom: filter strip + capture button */}
              <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-4">
                {/* Filter strip */}
                <div
                  ref={filterStripRef}
                  className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide"
                  style={{ scrollbarWidth: "none" }}
                >
                  {FILTERS.map((filter, idx) => (
                    <button
                      type="button"
                      key={filter.id}
                      data-ocid="camera.filter.button"
                      onClick={() => changeFilter(idx)}
                      className="flex flex-col items-center gap-1.5 shrink-0"
                    >
                      <span
                        className="w-14 h-14 rounded-full block transition-all duration-200"
                        style={{
                          background: filter.gradient,
                          boxShadow:
                            activeFilter.id === filter.id
                              ? "0 0 0 3px #fff"
                              : "0 0 0 1.5px rgba(255,255,255,0.25)",
                          transform:
                            activeFilter.id === filter.id
                              ? "scale(1.1)"
                              : "scale(1)",
                        }}
                      />
                      <span
                        className="text-xs font-medium tracking-wide"
                        style={{
                          color:
                            activeFilter.id === filter.id
                              ? "#fff"
                              : "rgba(255,255,255,0.5)",
                          textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                        }}
                      >
                        {filter.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Capture button */}
                <div className="flex items-center justify-center mt-2">
                  <button
                    type="button"
                    data-ocid="camera.primary_button"
                    onPointerDown={() => setIsPressed(true)}
                    onPointerUp={() => {
                      setIsPressed(false);
                      handleCapture();
                    }}
                    onPointerLeave={() => setIsPressed(false)}
                    disabled={!!cameraError}
                    className="relative disabled:opacity-40"
                    style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
                  >
                    {/* Outer ring */}
                    <span
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-100"
                      style={{
                        transform: isPressed ? "scale(0.92)" : "scale(1)",
                      }}
                    >
                      {/* Inner fill */}
                      <span
                        className="rounded-full bg-white transition-all duration-100"
                        style={{
                          width: isPressed ? "52px" : "60px",
                          height: isPressed ? "52px" : "60px",
                        }}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== POST-CAPTURE VIEW ===== */}
          {capturedImage && (
            <>
              {/* Full-screen captured photo */}
              <img
                src={capturedImage}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Right toolbar — static decoration icons */}
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-5"
                style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.7))" }}
              >
                {[
                  { Icon: Pen, label: "Draw" },
                  { Icon: Type, label: "Text" },
                  { Icon: Smile, label: "Sticker" },
                  { Icon: StickerIcon, label: "Crop" },
                ].map(({ Icon, label }) => (
                  <button
                    type="button"
                    key={label}
                    className="flex flex-col items-center gap-0.5 opacity-90"
                  >
                    <span className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <span
                      className="text-white text-[10px] font-medium"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Top-left X — discard */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-start px-4 pt-10">
                <button
                  type="button"
                  data-ocid="camera.close_button"
                  onClick={handleRetake}
                  style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.7))" }}
                >
                  <X className="w-7 h-7 text-white" strokeWidth={2.5} />
                </button>
              </div>

              {/* Bottom row: Save + Send */}
              <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-10">
                <div className="flex items-center justify-between gap-4">
                  {/* Save */}
                  <button
                    type="button"
                    data-ocid="camera.secondary_button"
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-3 rounded-full"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(10px)",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                    }}
                  >
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white text-sm font-semibold">
                      Save
                    </span>
                  </button>

                  {/* Send */}
                  <button
                    type="button"
                    data-ocid="camera.primary_button"
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.95)",
                    }}
                  >
                    <span className="text-black text-sm font-bold">
                      Send To
                    </span>
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Hidden canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
