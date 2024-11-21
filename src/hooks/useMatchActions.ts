import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

interface Action {
  id: number;
  name: string;
  key: string;
  color: string;
  match: number;
  enabled: boolean;
  events: any[] | null;
  default: boolean;
  status: string;
  updated_at: string;
  updated_by: number;
  created_at: string;
}

interface Event {
  id: number;
  match: number;
  action: number;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by: number;
  delay: number;
}

const TIME_OFFSET = 7; // 7 seconds offset

export function useMatchActions(matchId: string) {
  const queryClient = useQueryClient();

  const { data: actions, isLoading: isLoadingActions } = useQuery<Action[]>({
    queryKey: ['actions', matchId],
    queryFn: async () => {
      const response = await api.get(`/action?matches=${matchId}`);
      const actions = response.data;
      
      // Check if there's no custom action (default: false)
      const hasCustomAction = actions.some(action => action.default === false);
      
      if (!hasCustomAction) {
        // Create automatic action
        await createAutomaticAction.mutateAsync();
      }
      
      return actions;
    },
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data;
    },
  });

  const createAutomaticAction = useMutation({
    mutationFn: async () => {
      return api.post('/action', {
        name: "automatic",
        color: "#000000",
        match: Number(matchId),
        enabled: true,
        default: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', matchId] });
    }
  });

  const createEvent = useMutation({
    mutationFn: async (timestamp: number) => {
      const automaticAction = actions?.find(action => action.name === 'automatic');
      if (!automaticAction) throw new Error('No automatic action found');

      // Subtract TIME_OFFSET seconds from the timestamp
      const adjustedTimestamp = Math.max(0, timestamp - TIME_OFFSET);

      const response = await api.post<Event>('/event', {
        match: Number(matchId),
        action: automaticAction.id,
        delay: adjustedTimestamp
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
    }
  });

  return {
    actions,
    events,
    isLoading: isLoadingActions || isLoadingEvents,
    createEvent
  };
}