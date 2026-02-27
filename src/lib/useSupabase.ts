'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Idea, IdeaScore, Archetype, ReferenceStartup, VerticalItem, Conversation, Task, SFMeeting } from './types';

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

    const channel = supabase.channel(`${table}-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData();
      })
      .subscribe();

    const interval = setInterval(fetchData, 5000);

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData, table]);

  return { data, loading, refetch: fetchData };
}

// Static table hook (no realtime needed for reference data)
function useStaticTable<T>(
  queryFn: () => Promise<T[]>,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const refetch = useCallback(async () => {
    const result = await queryFnRef.current();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    queryFnRef.current().then(result => {
      if (mounted) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, setData, loading, refetch };
}

export function useIdeas() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('ideas').select('*').order('total_score', { ascending: false, nullsFirst: false });
    return (data || []) as Idea[];
  }, []);
  return useRealtimeTable('ideas', queryFn);
}

export function useVerticalsList() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('verticals_list').select('*').order('name');
    return (data || []) as VerticalItem[];
  }, []);
  return useRealtimeTable('verticals_list', queryFn);
}

export function useIdeaScores(ideaId?: string) {
  const queryFn = useCallback(async () => {
    let query = supabase.from('idea_scores').select('*');
    if (ideaId) query = query.eq('idea_id', ideaId);
    const { data } = await query.order('created_at', { ascending: false });
    return (data || []) as IdeaScore[];
  }, [ideaId]);
  return useRealtimeTable('idea_scores', queryFn);
}

export function useArchetypes() {
  const queryFn = useCallback(async () => {
    const { data } = await supabase.from('archetypes').select('*').order('name');
    return (data || []) as Archetype[];
  }, []);
  return useStaticTable(queryFn);
}

export function useReferenceStartups() {
  const queryFn = useCallback(async () => {
    // Supabase PostgREST defaults to 1000 rows max per request, so paginate
    const allRows: ReferenceStartup[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data } = await supabase
        .from('reference_startups')
        .select('*')
        .order('score', { ascending: false, nullsFirst: false })
        .range(from, from + pageSize - 1);
      if (data && data.length > 0) {
        allRows.push(...(data as ReferenceStartup[]));
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    return allRows;
  }, []);
  return useStaticTable(queryFn);
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
