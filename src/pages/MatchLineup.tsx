import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useState } from 'react';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Match {
  id: number;
  name: string;
}

interface Player {
  id: number;
  name: string;
  number: string;
  position: string;
}

// Mock data while backend endpoint is not available
const mockPlayers: Player[] = [
  { id: 1, name: 'John Smith', number: '10', position: 'Forward' },
  { id: 2, name: 'David Wilson', number: '1', position: 'Goalkeeper' },
  { id: 3, name: 'Michael Brown', number: '4', position: 'Defender' },
  { id: 4, name: 'James Davis', number: '8', position: 'Midfielder' },
  { id: 5, name: 'Robert Taylor', number: '7', position: 'Forward' },
  { id: 6, name: 'William Moore', number: '6', position: 'Midfielder' }
];

// Sort players by jersey number
const sortedPlayers = [...mockPlayers].sort((a, b) => {
  const numA = parseInt(a.number);
  const numB = parseInt(b.number);
  return numA - numB;
});

export default function MatchLineup() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const { data: match } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-black mb-4"
        >
          ← Back to Match
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-xl font-medium">{match?.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Select players for the starting lineup</p>
          </div>
          <button
            onClick={() => {
              // TODO: Save lineup
              toast.success('Lineup saved successfully');
              navigate(-1);
            }}
            disabled={selectedPlayers.length !== 11}
            className="btn flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Save Lineup ({selectedPlayers.length}/11)
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium">Available Players</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {sortedPlayers.map((player) => (
              <label
                key={player.id}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(player.id)}
                  onChange={() => handlePlayerToggle(player.id)}
                  className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black"
                />
                <div className="ml-4 flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {player.number}
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-500">{player.position}</p>
                  </div>
                </div>
              </label>
            ))}

            {sortedPlayers.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No players available. Add players to the team first.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}