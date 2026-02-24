'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Vertical, VerticalScore, Conversation, Task, SFMeeting } from './types';

function useRealtimeTable<T>(
  table: string,
  queryFn: () => Promise<T[]>,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    const result = await queryFn();
    if (mountedRef.current) {
      setData(result);
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Realtime subscription
    const channel = supabase.channel(`${table}-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData();
      })
      .subscribe();

    // Polling fallback every 5s in case realtime isn't working
    const interval = setInterval(fetchData, 5000);

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData, table]);

  return { data, loading, refetch: fetchData };
}

export function useVerticals() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('verticals').select('*').order('created_at', { ascending: false });
    return (data || []) as Vertical[];
  }, []);
  return useRealtimeTable('verticals', queryFn);
}

export function useScores(verticalId?: string) {
  const queryFn = useCallback(async () => {
    let query = supabase.from('vertical_scores').select('*');
    if (verticalId) query = query.eq('vertical_id', verticalId);
    const { data } = await query.order('created_at', { ascending: false });
    return (data || []) as VerticalScore[];
  }, [verticalId]);
  return useRealtimeTable('vertical_scores', queryFn);
}

export function useConversations() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('conversations').select('*').order('date', { ascending: false });
    return (data || []) as Conversation[];
  }, []);
  return useRealtimeTable('conversations', queryFn);
}

export function useTasks() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    return (data || []) as Task[];
  }, []);
  return useRealtimeTable('tasks', queryFn);
}

export function useSFMeetings() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('sf_meetings').select('*').order('created_at', { ascending: false });
    return (data || []) as SFMeeting[];
  }, []);
  return useRealtimeTable('sf_meetings', queryFn);
}
