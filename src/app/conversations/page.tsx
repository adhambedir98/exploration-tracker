'use client';

import { useState } from 'react';
import { useConversations, useIdeas } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Conversation, SignalStrength, TeamMember } from '@/lib/types';
import Modal from '@/components/Modal';
import { formatDateET } from '@/lib/utils';

export default function ConversationsPage() {
  const { data: conversations, loading } = useConversations();
  const { data: ideas } = useIdeas();
  const { user } = useUser();

  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editConv, setEditConv] = useState<Conversation | null>(null);

  const ideaMap = Object.fromEntries(ideas.map(i => [i.id, i.name]));

  if (loading) return <div className="text-dim text-sm">Loading conversations...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Conversations</h1>
          <p className="text-muted text-sm mt-1">{conversations.length} customer discovery conversations</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-3 py-1.5 text-xs bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors"
        >
          + Add Conversation
        </button>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Date</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Contact</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Role / Org</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Idea</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">By</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Signal</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Summary</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map(c => (
              <>
                <tr
                  key={c.id}
                  className="border-b border-border/50 hover:bg-surface/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <td className="px-3 py-2.5 text-sm font-mono text-muted">{formatDateET(c.date, 'MMM d')}</td>
                  <td className="px-3 py-2.5 text-sm text-text">{c.contact_name}</td>
                  <td className="px-3 py-2.5 text-sm text-muted">
                    {[c.contact_role, c.contact_org].filter(Boolean).join(', ') || '--'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted">
                    {c.idea_id ? ideaMap[c.idea_id] || 'Unknown' : 'General'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted">{c.conducted_by}</td>
                  <td className="px-3 py-2.5">
                    {c.signal_strength ? (
                      <div className={`w-2 h-2 rounded-full ${
                        c.signal_strength === 'strong' ? 'bg-emerald-400' :
                        c.signal_strength === 'moderate' ? 'bg-amber-400' : 'bg-red-400'
                      }`} title={c.signal_strength} />
                    ) : (
                      <span className="text-dim">--</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted truncate max-w-[200px]">{c.summary || '--'}</td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-exp`} className="border-b border-border/50">
                    <td colSpan={7} className="px-3 py-4 bg-surface/30">
                      <div className="space-y-3">
                        {c.summary && (
                          <div>
                            <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Summary</h4>
                            <p className="text-sm text-muted">{c.summary}</p>
                          </div>
                        )}
                        {c.raw_notes && (
                          <div>
                            <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Full Notes</h4>
                            <p className="text-sm text-muted whitespace-pre-wrap">{c.raw_notes}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditConv(c); }}
                            className="text-xs text-accent hover:text-accent/80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await supabase.from('conversations').delete().eq('id', c.id);
                              setExpanded(null);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {conversations.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-dim text-sm">No conversations logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConversationFormModal
        open={addOpen || !!editConv}
        onClose={() => { setAddOpen(false); setEditConv(null); }}
        user={user}
        ideas={ideas}
        existing={editConv}
      />
    </div>
  );
}

function ConversationFormModal({
  open, onClose, user, ideas, existing,
}: {
  open: boolean;
  onClose: () => void;
  user: TeamMember | null;
  ideas: { id: string; name: string }[];
  existing: Conversation | null;
}) {
  const [contactName, setContactName] = useState(existing?.contact_name || '');
  const [contactRole, setContactRole] = useState(existing?.contact_role || '');
  const [contactOrg, setContactOrg] = useState(existing?.contact_org || '');
  const [ideaId, setIdeaId] = useState(existing?.idea_id || '');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(existing?.summary || '');
  const [rawNotes, setRawNotes] = useState(existing?.raw_notes || '');
  const [signal, setSignal] = useState<SignalStrength | ''>(existing?.signal_strength || '');
  const [submitting, setSubmitting] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  if ((existing?.id || null) !== lastId) {
    setLastId(existing?.id || null);
    setContactName(existing?.contact_name || '');
    setContactRole(existing?.contact_role || '');
    setContactOrg(existing?.contact_org || '');
    setIdeaId(existing?.idea_id || '');
    setDate(existing?.date || new Date().toISOString().split('T')[0]);
    setSummary(existing?.summary || '');
    setRawNotes(existing?.raw_notes || '');
    setSignal(existing?.signal_strength || '');
  }

  const handleSubmit = async () => {
    if (!contactName.trim() || !user) return;
    setSubmitting(true);

    const payload = {
      contact_name: contactName.trim(),
      contact_role: contactRole.trim() || null,
      contact_org: contactOrg.trim() || null,
      idea_id: ideaId || null,
      conducted_by: user,
      date: date || null,
      summary: summary.trim() || null,
      raw_notes: rawNotes.trim() || null,
      signal_strength: (signal || null) as SignalStrength | null,
    };

    if (existing) {
      await supabase.from('conversations').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('conversations').insert(payload);
    }

    setSubmitting(false);
    setContactName('');
    setContactRole('');
    setContactOrg('');
    setIdeaId('');
    setDate(new Date().toISOString().split('T')[0]);
    setSummary('');
    setRawNotes('');
    setSignal('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Conversation' : 'Log Conversation'} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Contact Name *</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full" placeholder="John Smith" />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Role</label>
            <input value={contactRole} onChange={e => setContactRole(e.target.value)} className="w-full" placeholder="e.g. OR Nurse Manager" />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Organization</label>
            <input value={contactOrg} onChange={e => setContactOrg(e.target.value)} className="w-full" placeholder="e.g. Johns Hopkins" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Linked Idea</label>
            <select value={ideaId} onChange={e => setIdeaId(e.target.value)} className="w-full">
              <option value="">General</option>
              {ideas.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Signal Strength</label>
            <select value={signal} onChange={e => setSignal(e.target.value as SignalStrength | '')} className="w-full">
              <option value="">--</option>
              <option value="strong">Strong</option>
              <option value="moderate">Moderate</option>
              <option value="weak">Weak</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Summary (2-3 sentences)</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full h-16 resize-none" placeholder="Key takeaways..." />
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Raw Notes</label>
          <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} className="w-full h-32 resize-none" placeholder="Full notes from the conversation..." />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!contactName.trim() || submitting}
          className="w-full py-2 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : existing ? 'Update Conversation' : 'Log Conversation'}
        </button>
      </div>
    </Modal>
  );
}
