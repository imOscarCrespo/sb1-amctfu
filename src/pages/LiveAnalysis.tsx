import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Plus, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useTimer } from '../hooks/useTimer';
import toast from 'react-hot-toast';
import { useState } from 'react';
import Modal from '../components/Modal';

interface Match {
  id: number;
  name: string;
  team: number;
  home_score: number;
  away_score: number;
}

interface Event {
  id: number;
  action: number;
  delay: number;
  created_at: string;
}

const EVENT_TYPES = {
  SUBSTITUTION_HOME: 'substitution_home',
  SUBSTITUTION_AWAY: 'substitution_away',
  YELLOW_CARD_HOME: 'yellow_card_home',
  YELLOW_CARD_AWAY: 'yellow_card_away',
  RED_CARD_HOME: 'red_card_home',
  RED_CARD_AWAY: 'red_card_away',
  GOAL_HOME: 'goal_home',
  GOAL_AWAY: 'goal_away',
  CORNER_HOME: 'corner_home',
  CORNER_AWAY: 'corner_away'
} as const;

type Tab = 'analysis' | 'events';

export default function LiveAnalysis() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { time, isRunning, toggleTimer, resetTimer, formatTime } = useTimer(matchId || '');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const selectedTeamName = localStorage.getItem('selectedTeamName') || 'Home Team';
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  const { data: match } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data;
    },
  });

  const updateScore = useMutation({
    mutationFn: async (newScore: { home: number; away: number }) => {
      return api.patch(`/match/${matchId}`, {
        home_score: newScore.home,
        away_score: newScore.away
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      setIsScoreModalOpen(false);
      toast.success('Score updated successfully');
    },
    onError: () => {
      toast.error('Failed to update score');
    }
  });

  const createEvent = useMutation({
    mutationFn: async (type?: string) => {
      const automaticAction = actions?.find(action => action.name === 'automatic');
      if (!automaticAction) throw new Error('No automatic action found');

      return api.post('/event', {
        match: Number(matchId),
        action: automaticAction.id,
        delay: time,
        type
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      toast.success('Event recorded');
      // Switch to events tab when a new event is created
      setActiveTab('events');
    },
    onError: () => {
      toast.error('Failed to record event');
    }
  });

  const sortedEvents = events?.slice().reverse() || [];

  const renderAnalysisTab = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Score Display */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <p className="text-sm font-medium mb-1">{selectedTeamName}</p>
          <p className="text-4xl font-bold">{match?.home_score || 0}</p>
        </div>
        <div className="px-4">
          <button
            onClick={() => {
              setScore({
                home: match?.home_score || 0,
                away: match?.away_score || 0
              });
              setIsScoreModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Edit score"
          >
            <Edit2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm font-medium mb-1">{match?.name}</p>
          <p className="text-4xl font-bold">{match?.away_score || 0}</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold mb-6">
          {formatTime(time)}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleTimer}
            className="btn flex items-center gap-2 px-6"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="btn bg-gray-500 hover:bg-gray-600 flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Generic Event Button */}
        <button
          onClick={() => createEvent.mutate()}
          disabled={createEvent.isPending}
          className="w-full btn bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 px-8 py-4 text-lg"
        >
          <Plus className="w-6 h-6" />
          <span className="flex items-center gap-2">
            Record Event 📝
          </span>
        </button>

        {/* Events Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-center mb-2">{selectedTeamName} 🏠</p>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.SUBSTITUTION_HOME)}
              disabled={createEvent.isPending}
              className="w-full btn bg-purple-500 hover:bg-purple-600"
            >
              Substitution 🔄
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.YELLOW_CARD_HOME)}
              disabled={createEvent.isPending}
              className="w-full btn bg-yellow-500 hover:bg-yellow-600"
            >
              Yellow Card 🟨
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.RED_CARD_HOME)}
              disabled={createEvent.isPending}
              className="w-full btn bg-red-500 hover:bg-red-600"
            >
              Red Card 🟥
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.GOAL_HOME)}
              disabled={createEvent.isPending}
              className="w-full btn bg-green-500 hover:bg-green-600"
            >
              Goal ⚽
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.CORNER_HOME)}
              disabled={createEvent.isPending}
              className="w-full btn bg-orange-500 hover:bg-orange-600"
            >
              Corner ⛳
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-center mb-2">{match?.name} 🚌</p>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.SUBSTITUTION_AWAY)}
              disabled={createEvent.isPending}
              className="w-full btn bg-purple-500 hover:bg-purple-600"
            >
              Substitution 🔄
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.YELLOW_CARD_AWAY)}
              disabled={createEvent.isPending}
              className="w-full btn bg-yellow-500 hover:bg-yellow-600"
            >
              Yellow Card 🟨
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.RED_CARD_AWAY)}
              disabled={createEvent.isPending}
              className="w-full btn bg-red-500 hover:bg-red-600"
            >
              Red Card 🟥
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.GOAL_AWAY)}
              disabled={createEvent.isPending}
              className="w-full btn bg-green-500 hover:bg-green-600"
            >
              Goal ⚽
            </button>
            <button
              onClick={() => createEvent.mutate(EVENT_TYPES.CORNER_AWAY)}
              disabled={createEvent.isPending}
              className="w-full btn bg-orange-500 hover:bg-orange-600"
            >
              Corner ⛳
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="space-y-3">
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-mono">{formatTime(event.delay)}</span>
            <span className="text-sm text-gray-500">
              {new Date(event.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}

        {!events?.length && (
          <p className="text-center text-gray-500 py-4">
            No events recorded yet
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-black mb-4"
        >
          ← Back to Match
        </button>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Events ({sortedEvents.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analysis' ? renderAnalysisTab() : renderEventsTab()}
      </div>

      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title="Update Score"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          updateScore.mutate(score);
        }}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedTeamName}
              </label>
              <input
                type="number"
                min="0"
                value={score.home}
                onChange={(e) => setScore(prev => ({ ...prev, home: parseInt(e.target.value) || 0 }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {match?.name}
              </label>
              <input
                type="number"
                min="0"
                value={score.away}
                onChange={(e) => setScore(prev => ({ ...prev, away: parseInt(e.target.value) || 0 }))}
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsScoreModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={updateScore.isPending}
            >
              {updateScore.isPending ? 'Updating...' : 'Update Score'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}