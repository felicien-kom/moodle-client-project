import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { serveFile } from "@/services/files.service";

export default function VueVideos({ fileId, fileName, onRetour }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadVideo();
    return () => {
      if (videoUrl) {
        window.URL.revokeObjectURL(videoUrl);
      }
    };
  }, [fileId]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const blobUrl = await serveFile(fileId);
      setVideoUrl(blobUrl);
    } catch (err) {
      setError("Impossible de charger la vidéo: " + (err.message || err));
      console.error("Erreur chargement vidéo:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.() || 
        containerRef.current.webkitRequestFullscreen?.() ||
        containerRef.current.msRequestFullscreen?.();
      } else {
        document.exitFullscreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.msExitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button onClick={onRetour} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onRetour}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-lg font-bold text-white truncate max-w-2xl">{fileName || "Vidéo"}</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={containerRef}
          className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl"
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            onPlay={handlePlay}
            onPause={handlePause}
            controls
            autoPlay
          />
        </div>
      </div>

      {/* Controls Info */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>Lecteur vidéo intégré</p>
            <p>Utilisez les contrôles du lecteur pour naviguer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
