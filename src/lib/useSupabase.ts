'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { Vertical, VerticalScore, Conversation, Task, SFMeeting } from './types';

export function useVerticals() {
  const [data, setData] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('verticals').select('*').order('created_at', { ascending: false });
    if (data) setData(data as Vertical[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase.channel('verticals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verticals' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useScores(verticalId?: string) {
  const [data, setData] = useState<VerticalScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let query = supabase.from('vertical_scores').select('*');
    if (verticalId) query = query.eq('vertical_id', verticalId);
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setData(data as VerticalScore[]);
    setLoading(false);
  }, [verticalId]);

  useEffect(() => {
    fetch();
    const channel = supabase.channel(`scores-changes-${verticalId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vertical_scores' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, verticalId]);

  return { data, loading, refetch: fetch };
}

export function useConversations() {
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('conversations').select('*').order('date', { ascending: false });
    if (data) setData(data as Conversation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase.channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useTasks() {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setData(data as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase.channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useSFMeetings() {
  const [data, setData] = useState<SFMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('sf_meetings').select('*').order('created_at', { ascending: false });
    if (data) setData(data as SFMeeting[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase.channel('sf-meetings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sf_meetings' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { data, loading, refetch: fetch };
}
