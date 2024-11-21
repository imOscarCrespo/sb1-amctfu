import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Maximize2, Minimize2, Settings2, Plus, Pencil, Eraser } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  videoUrl: string;
  onFileChange: (file: File) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  onAddAction: (timestamp: number) => Promise<{ created_at: string }>;
  initialMarkers?: { timestamp: number; date: string; }[];
}

interface Marker {
  timestamp: number;
  date: string;
}

export default function VideoPlayer({ 
  videoUrl, 
  onFileChange, 
  onRemove,
  showRemoveButton = true,
  onAddAction,
  initialMarkers = []
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showTools, setShowTools] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>(initialMarkers);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMarkers(initialMarkers);
  }, [initialMarkers]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) {
        setShowTools(false);
        setIsDrawMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (isDrawMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }
  }, [isDrawMode]);

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const handleAddAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const video = videoRef.current;
    if (video) {
      try {
        const currentTime = video.currentTime;
        const response = await onAddAction(currentTime);
        
        const newMarker = {
          timestamp: currentTime,
          date: response.created_at
        };
        setMarkers(prev => [...prev, newMarker]);
        toast.success('Action added successfully');
      } catch (error) {
        toast.error('Failed to add action');
      }
    }
  };

  const seekToTime = (timestamp: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = timestamp;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawMode || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.strokeStyle = '#00ff00'; // Bright green color
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="card overflow-hidden">
      <div 
        ref={containerRef} 
        className={`relative group bg-black ${isFullscreen ? 'h-screen flex flex-col' : ''}`}
      >
        <style>{`
          video::-webkit-media-controls-enclosure {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            width: 100%;
            padding: 0;
            margin-bottom: 10px;
          }

          video::-webkit-media-controls-panel {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            width: 100%;
            padding: 0 12px;
            margin-bottom: 0;
          }

          video::-webkit-media-controls-timeline-container {
            width: 100%;
            margin: 0;
            padding-top: 5px;
          }

          video::-webkit-media-controls-timeline {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          video::-webkit-media-controls-volume-slider {
            margin: 0;
          }

          video::-webkit-media-controls-play-button {
            margin: 0;
          }
          
          .marker-overlay {
            position: absolute;
            bottom: 45px;
            left: 12px;
            right: 12px;
            height: 0;
            pointer-events: none;
          }
          
          .marker-overlay .marker {
            position: absolute;
            bottom: -2px;
            transform: translateX(-50%);
            cursor: pointer;
            pointer-events: auto;
          }
        `}</style>

        <video
          ref={videoRef}
          src={videoUrl}
          controls
          controlsList="nodownload nofullscreen"
          className={`${isFullscreen ? 'flex-1 h-[calc(100%-24px)]' : 'aspect-video'} w-full`}
        />

        {isDrawMode && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        )}
        
        {duration > 0 && (
          <div className="marker-overlay">
            {markers.map((marker, index) => (
              <div 
                key={index}
                className="marker group/marker"
                style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                onClick={() => seekToTime(marker.timestamp)}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity">
                  {new Date(marker.timestamp * 1000).toISOString().substr(11, 8)}
                </div>
              </div>
            ))}
          </div>
        )}

        {isFullscreen && (
          <>
            <button
              onClick={() => setShowTools(!showTools)}
              className="absolute top-4 right-4 p-2 bg-blue-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg hover:shadow-blue-500/50"
              title="Toggle tools"
            >
              <Settings2 className="w-5 h-5" />
            </button>

            <div className={`absolute top-4 right-16 flex gap-2 transition-all duration-200 ${showTools ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button
                onClick={handleAddAction}
                className="p-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-500/50"
                title="Add action"
              >
                <Plus className="w-5 h-5" />
              </button>
              {isDrawMode ? (
                <button
                  onClick={() => {
                    setIsDrawMode(false);
                    clearCanvas();
                  }}
                  className="p-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg hover:shadow-red-500/50"
                  title="Stop drawing"
                >
                  <Eraser className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsDrawMode(true)}
                  className="p-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-500/50"
                  title="Start drawing"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleFullscreen}
                className="p-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-500/50"
                title="Exit fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {!isFullscreen && (
          <button
            onClick={handleFullscreen}
            className="absolute bottom-20 right-4 p-2 bg-blue-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 hover:bg-blue-600 shadow-lg hover:shadow-blue-500/50"
            title="Enter fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isFullscreen && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <label className="btn inline-block cursor-pointer">
            Change Video
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {showRemoveButton && onRemove && (
            <button
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
              title="Remove video"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}