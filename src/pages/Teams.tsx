import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';

interface Team {
  id: number;
  name: string;
  club: number;
}

export default function Teams() {
  const navigate = useNavigate();
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/team');
      return response.data;
    },
  });

  const handleTeamSelect = (team: Team) => {
    localStorage.setItem('selectedTeamName', team.name);
    navigate(`/team/${team.id}/matches`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black" />
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium mb-8">Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams?.map((team) => (
          <button
            key={team.id}
            onClick={() => handleTeamSelect(team)}
            className="text-left p-6 border border-gray-200 rounded hover:border-black transition-colors"
          >
            <h2 className="text-lg font-medium">{team.name}</h2>
          </button>
        ))}
      </div>
    </main>
  );
}