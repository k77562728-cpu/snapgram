# Snapgram - Photo Camera with Filters

## Current State
Snapgram is a full social media app with Reels, Stories, Chat, Profile, and Create Reel tabs. The Create tab is for creating reels (video). No camera/photo feature exists.

## Requested Changes (Diff)

### Add
- New `CameraFilter` component: a full photo-capture experience with live camera preview and real-time CSS/canvas filters
- Filter options: Normal, Vivid, Noir, Warm, Cool, Fade, Dramatic, Vintage (applied via CSS filter on the video preview and canvas snapshot)
- Camera controls: Capture photo button, switch front/back camera, close/cancel
- After capture: preview the captured photo with the chosen filter applied, option to retake or save/share to profile
- A camera/photo icon button in the header (or as a new bottom nav tab "Camera") to open the camera modal

### Modify
- `App.tsx`: Add a "Camera" entry in the nav or a camera icon button in the header that opens the CameraFilter modal/sheet

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/CameraFilter.tsx` with:
   - useRef for video element and canvas
   - getUserMedia to start live preview
   - 8 filter presets defined as CSS filter strings
   - Horizontal scrollable filter selector strip with preview thumbnails
   - Capture button that draws video frame to canvas with filter applied
   - Post-capture screen: show result, Retake / Save buttons
   - Save downloads the image or stores in localStorage for profile
2. Update `App.tsx` to add a Camera icon button in the header that sets a `showCamera` state, rendering CameraFilter as an overlay/modal
