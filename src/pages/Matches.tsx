import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, PlayCircle, Users } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/axios';
import Modal from '../components/Modal';
import TeamSidebar from '../components/TeamSidebar';
import toast from 'react-hot-toast';

interface Match {
  id: number;
  name: string;
  created_at: string;
}

export default function Matches() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchName, setMatchName] = useState('');

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const response = await api.get(`/match?teams=${teamId}`);
      return response.data;
    },
  });

  const createMatch = useMutation({
    mutationFn: async (name: string) => {
      const matchResponse = await api.post('/match', {
        name,
        team: Number(teamId),
        tab: 1
      });

      await api.post('/action', {
        name: "automatic",
        color: "#000000",
        match: matchResponse.data.id,
        enabled: true,
        default: false
      });

      return matchResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', teamId] });
      setIsModalOpen(false);
      setMatchName('');
      toast.success('Match created successfully');
    },
    onError: () => {
      toast.error('Failed to create match');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchName.trim()) {
      createMatch.mutate(matchName);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeamSidebar teamId={teamId || ''} activeTab="matches" />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-medium">Matches</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Match
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches?.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-black transition-colors"
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/match/${match.id}`)}
                >
                  <h3 className="font-medium mb-2">{match.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(match.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="border-t border-gray-100 p-3 bg-gray-50 flex gap-2">
                  <button
                    onClick={() => navigate(`/match/${match.id}/lineup`)}
                    className="btn bg-blue-500 hover:bg-blue-600 flex-1 flex items-center justify-center gap-2 py-2"
                  >
                    <Users className="w-4 h-4" />
                    Lineup
                  </button>
                  <button
                    onClick={() => navigate(`/match/${match.id}/live`)}
                    className="btn bg-green-600 hover:bg-green-700 flex-1 flex items-center justify-center gap-2 py-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Live
                  </button>
                </div>
              </div>
            ))}

            {!matches?.length && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                No matches found. Create your first match to get started!
              </div>
            )}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setMatchName('');
          }}
          title="Create New Match"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="matchName" className="block text-sm font-medium text-gray-700 mb-1">
                Match Name
              </label>
              <input
                type="text"
                id="matchName"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                className="input"
                placeholder="Enter match name"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setMatchName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={createMatch.isPending}
              >
                {createMatch.isPending ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}