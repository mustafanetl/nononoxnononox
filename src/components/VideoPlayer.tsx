import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  /** "background" = autoplay muted loop, no controls. "detail" = full controls. */
  mode?: "background" | "detail";
  className?: string;
  poster?: string;
}

/**
 * Reusable video player.
 * - Background mode: autoplay, muted, loop, no controls (for cards/heroes).
 * - Detail mode: full controls with play/pause overlay (for modals/detail pages).
 */
const VideoPlayer = ({ src, mode = "background", className = "", poster }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(mode === "background");
  const [muted, setMuted] = useState(true);

  if (mode === "background") {
    return (
      <video
        src={src}
        className={`w-full h-full object-cover ${className}`}
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
      />
    );
  }

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover rounded-xl"
        muted={muted}
        loop
        playsInline
        poster={poster}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        controls
      />
      {/* Overlay play button when paused */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl transition-opacity"
          aria-label="Play video"
        >
          <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-black ml-0.5" />
          </div>
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
