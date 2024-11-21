import { useParams } from 'react-router-dom';
import TeamSidebar from '../components/TeamSidebar';
import { Plus, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Player {
  id: number;
  name: string;
  number: string;
  position: string;
  minutes_played: number;
}

// Mock data while backend endpoint is not available
const mockPlayers: Player[] = [
  { id: 1, name: 'John Smith', number: '10', position: 'Forward', minutes_played: 540 },
  { id: 2, name: 'David Wilson', number: '1', position: 'Goalkeeper', minutes_played: 450 },
  { id: 3, name: 'Michael Brown', number: '4', position: 'Defender', minutes_played: 380 },
  { id: 4, name: 'James Davis', number: '8', position: 'Midfielder', minutes_played: 320 },
  { id: 5, name: 'Robert Taylor', number: '7', position: 'Forward', minutes_played: 290 },
  { id: 6, name: 'William Moore', number: '6', position: 'Midfielder', minutes_played: 180 }
];

export default function Players() {
  const { teamId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerData, setPlayerData] = useState({
    name: '',
    number: '',
    position: '',
  });
  const [players, setPlayers] = useState<Player[]>(mockPlayers);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerData.name.trim() && playerData.number.trim() && playerData.position.trim()) {
      // Add new player to mock data
      const newPlayer: Player = {
        id: players.length + 1,
        ...playerData,
        minutes_played: 0
      };
      
      setPlayers(prev => [...prev, newPlayer]);
      setIsModalOpen(false);
      setPlayerData({ name: '', number: '', position: '' });
      toast.success('Player added successfully');
    }
  };

  const positions = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward'
  ];

  const sortedPlayers = [...players].sort((a, b) => b.minutes_played - a.minutes_played);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeamSidebar teamId={teamId || ''} activeTab="players" />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-medium">Players</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-black transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium">
                    {player.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{player.name}</h3>
                    <p className="text-sm text-gray-500">{player.position}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{player.minutes_played} minutes played</span>
                </div>
              </div>
            ))}

            {!players.length && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No players found. Add your first player to get started!
              </div>
            )}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPlayerData({ name: '', number: '', position: '' });
          }}
          title="Add New Player"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={playerData.name}
                  onChange={(e) => setPlayerData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Enter player name"
                  required
                />
              </div>

              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                  Jersey Number
                </label>
                <input
                  type="text"
                  id="number"
                  value={playerData.number}
                  onChange={(e) => setPlayerData(prev => ({ ...prev, number: e.target.value }))}
                  className="input"
                  placeholder="Enter jersey number"
                  required
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  id="position"
                  value={playerData.position}
                  onChange={(e) => setPlayerData(prev => ({ ...prev, position: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Select position</option>
                  {positions.map(position => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setPlayerData({ name: '', number: '', position: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
              >
                Add Player
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}