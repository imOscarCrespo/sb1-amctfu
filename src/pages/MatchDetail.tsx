import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import toast from 'react-hot-toast';
import { useMatchVideo } from '../hooks/useMatchVideo';
import { useMatchActions } from '../hooks/useMatchActions';
import VideoPlayer from '../components/VideoPlayer';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useState } from 'react';

interface Match {
  id: number;
  name: string;
  timeline: any;
  team: number;
  media: string | null;
  status: string;
  tab: number;
  created_at: string;
  started_at: string;
  finished_at: string;
  mode: string;
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { videoUrl, handleFileUpload, removeVideo } = useMatchVideo(matchId || '');
  const { actions, events, isLoading: isLoadingActions, createEvent } = useMatchActions(matchId || '');
  const [showEvents, setShowEvents] = useState(true);
  const [delayAdjustment, setDelayAdjustment] = useState('');
  const [individualDelays, setIndividualDelays] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const adjustEventDelays = useMutation({
    mutationFn: async (adjustment: number) => {
      if (!events?.length) return;
      
      const eventIds = events.map(event => event.id);
      
      await api.patch('/event', {
        ids: eventIds,
        update: {
          delay: adjustment
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event times adjusted successfully');
      setDelayAdjustment('');
    },
    onError: () => {
      toast.error('Failed to adjust event times');
    }
  });

  const adjustIndividualDelay = useMutation({
    mutationFn: async ({ eventId, adjustment }: { eventId: number; adjustment: number }) => {
      const event = events?.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      await api.patch(`/event/${eventId}/`, {
        delay: Math.max(0, event.delay + adjustment)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event time updated');
      setIndividualDelays({});
    },
    onError: () => {
      toast.error('Failed to update event time');
    }
  });

  const handleDelayAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustment = parseInt(delayAdjustment);
    if (isNaN(adjustment)) {
      toast.error('Please enter a valid number');
      return;
    }

    // Para el ajuste múltiple, calculamos el nuevo delay para cada evento
    const baseEvent = events?.[0];
    if (!baseEvent) return;

    const newDelay = Math.max(0, baseEvent.delay + adjustment);
    adjustEventDelays.mutate(newDelay);
  };

  const handleIndividualDelay = (eventId: number) => {
    const adjustment = individualDelays[eventId];
    if (!adjustment) return;

    const parsedAdjustment = parseInt(adjustment);
    if (isNaN(parsedAdjustment)) {
      toast.error('Please enter a valid number');
      return;
    }

    adjustIndividualDelay.mutate({ eventId, adjustment: parsedAdjustment });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
      toast.success('Match footage loaded successfully');
    }
  };

  if (isLoading || isLoadingActions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black" />
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-black mb-2"
        >
          ← Back to Matches
        </button>
        <h1 className="text-xl font-medium">{match?.name}</h1>
      </div>

      {!match?.media && !videoUrl && (
        <div className="border border-gray-200 rounded p-8 text-center mb-8">
          <h3 className="text-lg font-medium">Upload Match Footage</h3>
          <p className="text-sm text-gray-500 mt-2">Add video footage for detailed analysis</p>
          <div className="mt-6">
            <label htmlFor="file-upload" className="btn cursor-pointer">
              Select Video
              <input
                id="file-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>
      )}

      {(match?.media || videoUrl) && (
        <div className="mb-8">
          <VideoPlayer 
            videoUrl={match?.media || videoUrl || ''} 
            onFileChange={(file) => {
              handleFileUpload(file);
              toast.success('Match footage updated successfully');
            }}
            onRemove={() => {
              removeVideo();
              toast.success('Video removed successfully');
            }}
            showRemoveButton={!match?.media}
            onAddAction={async (timestamp) => {
              const result = await createEvent.mutateAsync(timestamp);
              return result;
            }}
            initialMarkers={events?.map(event => ({
              timestamp: event.delay,
              date: event.created_at
            })) || []}
          />
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleDelayAdjustment} className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjust All Event Times (seconds)
              </label>
              <input
                type="number"
                value={delayAdjustment}
                onChange={(e) => setDelayAdjustment(e.target.value)}
                className="input"
                placeholder="Enter adjustment (e.g., +20 or -10)"
              />
            </div>
            <button
              type="submit"
              disabled={!delayAdjustment || adjustEventDelays.isPending}
              className="btn"
            >
              {adjustEventDelays.isPending ? 'Adjusting...' : 'Apply to All'}
            </button>
          </form>
        </div>

        <button
          onClick={() => setShowEvents(!showEvents)}
          className="flex items-center gap-2 text-lg font-medium p-4 w-full hover:bg-gray-50 transition-colors"
        >
          {showEvents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          Events ({events?.length || 0})
        </button>

        {showEvents && (
          <div className="border-t border-gray-200">
            {events && events.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 text-sm font-medium">Time</th>
                    <th className="text-left p-4 text-sm font-medium">Action</th>
                    <th className="text-left p-4 text-sm font-medium">Adjust Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const action = actions?.find(a => a.id === event.action);
                    return (
                      <tr key={event.id} className="border-b border-gray-200 last:border-0">
                        <td className="p-4">
                          {new Date(event.delay * 1000).toISOString().substr(11, 8)}
                        </td>
                        <td className="p-4">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${action?.color}20`, 
                              color: action?.color 
                            }}
                          >
                            {action?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={individualDelays[event.id] || ''}
                              onChange={(e) => setIndividualDelays(prev => ({
                                ...prev,
                                [event.id]: e.target.value
                              }))}
                              placeholder="Enter adjustment (e.g., +20 or -10)"
                              className="input text-sm"
                            />
                            <button
                              onClick={() => handleIndividualDelay(event.id)}
                              disabled={!individualDelays[event.id]}
                              className="btn p-2"
                              title="Save time adjustment"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No events recorded yet
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}