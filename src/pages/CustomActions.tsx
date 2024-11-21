import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import TeamSidebar from '../components/TeamSidebar';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface Action {
  id: number;
  name: string;
  key: string;
  color: string;
  match: number;
  enabled: boolean;
  default: boolean;
}

interface Match {
  id: number;
  name: string;
}

export default function CustomActions() {
  const { teamId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionData, setActionData] = useState({
    name: '',
    key: '',
    color: '#000000',
    match: ''
  });

  const { data: matches } = useQuery<Match[]>({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const response = await api.get(`/match?teams=${teamId}`);
      return response.data;
    },
  });

  const { data: customActions } = useQuery<Action[]>({
    queryKey: ['custom-actions', teamId],
    queryFn: async () => {
      const response = await api.get(`/action?teams=${teamId}`);
      return response.data.filter((action: Action) => !action.default);
    },
  });

  const { data: defaultActions } = useQuery<Action[]>({
    queryKey: ['default-actions', teamId],
    queryFn: async () => {
      const response = await api.get(`/action?teams=${teamId}`);
      return response.data.filter((action: Action) => action.default);
    },
  });

  const createAction = useMutation({
    mutationFn: async (data: typeof actionData) => {
      return api.post('/action', {
        name: data.name,
        key: data.key || data.name.toLowerCase().replace(/\s+/g, '_'),
        color: data.color,
        match: Number(data.match),
        enabled: true,
        default: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-actions', teamId] });
      setIsModalOpen(false);
      setActionData({ name: '', key: '', color: '#000000', match: '' });
      toast.success('Action created successfully');
    },
    onError: () => {
      toast.error('Failed to create action');
    }
  });

  const deleteAction = useMutation({
    mutationFn: async (actionId: number) => {
      return api.delete(`/action/${actionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-actions', teamId] });
      toast.success('Action deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete action');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionData.name && actionData.color && actionData.match) {
      createAction.mutate(actionData);
    }
  };

  const handleNameChange = (name: string) => {
    setActionData(prev => ({
      ...prev,
      name,
      key: name.toLowerCase().replace(/\s+/g, '_')
    }));
  };

  const renderActionCard = (action: Action, isDefault: boolean) => {
    const match = matches?.find(m => m.id === action.match);
    return (
      <div
        key={action.id}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: action.color }}
            />
            <h3 className="font-medium">{action.name}</h3>
          </div>
          {!isDefault && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this action?')) {
                  deleteAction.mutate(action.id);
                }
              }}
              className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">Key: {action.key}</p>
        <p className="text-sm text-gray-500">Match: {match?.name}</p>
        {isDefault && (
          <p className="text-xs text-blue-500 mt-2">Default Action</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeamSidebar teamId={teamId || ''} activeTab="actions" />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-medium">Actions</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Action
            </button>
          </div>

          {defaultActions && defaultActions.length > 0 && (
            <>
              <h2 className="text-lg font-medium mb-4">Default Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {defaultActions.map(action => renderActionCard(action, true))}
              </div>
            </>
          )}

          <h2 className="text-lg font-medium mb-4">Custom Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customActions?.map(action => renderActionCard(action, false))}

            {!customActions?.length && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                No custom actions found. Create your first action to get started!
              </div>
            )}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActionData({ name: '', key: '', color: '#000000', match: '' });
          }}
          title="Create New Action"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Name
                </label>
                <input
                  type="text"
                  value={actionData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input"
                  placeholder="Enter action name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={actionData.key}
                  onChange={(e) => setActionData(prev => ({ ...prev, key: e.target.value }))}
                  className="input bg-gray-50"
                  placeholder="Auto-generated from name"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={actionData.color}
                  onChange={(e) => setActionData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 p-1 rounded border border-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match
                </label>
                <select
                  value={actionData.match}
                  onChange={(e) => setActionData(prev => ({ ...prev, match: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Select match</option>
                  {matches?.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.name}
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
                  setActionData({ name: '', key: '', color: '#000000', match: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={createAction.isPending}
              >
                {createAction.isPending ? 'Creating...' : 'Create Action'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}