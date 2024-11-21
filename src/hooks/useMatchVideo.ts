import { useState, useEffect } from 'react';

export function useMatchVideo(matchId: string) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get stored video URL for this match
    const storedUrl = localStorage.getItem(`match-video-${matchId}`);
    if (storedUrl) {
      setVideoUrl(storedUrl);
    }
  }, [matchId]);

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    // Store the URL with the match ID
    localStorage.setItem(`match-video-${matchId}`, url);
    setVideoUrl(url);
  };

  const removeVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      localStorage.removeItem(`match-video-${matchId}`);
      setVideoUrl(null);
    }
  };

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl && !localStorage.getItem(`match-video-${matchId}`)) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl, matchId]);

  return {
    videoUrl,
    handleFileUpload,
    removeVideo
  };
}