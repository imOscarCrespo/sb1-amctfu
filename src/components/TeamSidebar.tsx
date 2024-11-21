import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../lib/axios';
import { useState } from 'react';

interface Team {
  id: number;
  name: string;
}

interface TeamSidebarProps {
  teamId: string;
  activeTab: 'matches' | 'players' | 'actions';
}

export default function TeamSidebar({ teamId, activeTab }: TeamSidebarProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: team } = useQuery<Team>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const response = await api.get(`/team/${teamId}`);
      return response.data;
    },
  });

  const tabs = [
    {
      id: 'matches',
      name: 'Matches',
      icon: Trophy,
      path: `/team/${teamId}/matches`
    },
    {
      id: 'players',
      name: 'Players',
      icon: Users,
      path: `/team/${teamId}/players`
    },
    {
      id: 'actions',
      name: 'Actions',
      icon: Settings,
      path: `/team/${teamId}/actions`
    }
  ];

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 min-h-screen transition-all duration-200 relative group`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md transition-shadow md:hidden"
      >
        {isExpanded ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      <div className="p-4">
        {isExpanded ? (
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-black mb-4"
          >
            ← Back to Teams
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black mb-4"
          >
            ←
          </button>
        )}

        <h2 className={`font-medium mb-6 truncate transition-all duration-200 ${
          isExpanded ? 'text-xl' : 'text-sm text-center'
        }`}>
          {isExpanded ? team?.name : team?.name?.[0]}
        </h2>

        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={!isExpanded ? tab.name : undefined}
              >
                <Icon className="w-5 h-5 min-w-5" />
                <span className={`truncate transition-all duration-200 ${
                  isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                }`}>
                  {tab.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Hover Tooltip for Collapsed State */}
      {!isExpanded && (
        <div className="fixed left-16 top-0 hidden group-hover:block">
          <div className="py-2 ml-2">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`whitespace-nowrap px-3 py-2 text-sm rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600'
                } shadow-lg`}
                style={{
                  visibility: activeTab === tab.id ? 'visible' : 'hidden'
                }}
              >
                {tab.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}