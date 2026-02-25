'use client';

import { useState, useMemo } from 'react';
import { useSFMeetings } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { SFMeeting, MeetingStatus, MeetingType, TeamMember } from '@/lib/types';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { formatDatetimeET } from '@/lib/utils';

const PIPELINE_COLUMNS: { status: MeetingStatus; label: string }[] = [
  { status: 'need_intro', label: 'Need Intro' },
  { status: 'intro_requested', label: 'Intro Requested' },
  { status: 'intro_made', label: 'Intro Made' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'completed', label: 'Completed' },
  { status: 'no_response', label: 'No Response' },
];

export default function MeetingsPage() {
  const { data: meetings, loading } = useSFMeetings();
  const { user } = useUser();

  const [addOpen, setAddOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<SFMeeting | null>(null);
  const [dragMeeting, setDragMeeting] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = meetings.length;
    const confirmed = meetings.filter(m => ['confirmed', 'completed'].includes(m.status)).length;
    const byType: Record<string, number> = {};
    meetings.forEach(m => {
      byType[m.meeting_type] = (byType[m.meeting_type] || 0) + 1;
    });
    return { total, confirmed, byType };
  }, [meetings]);

  const moveMeeting = async (meetingId: string, newStatus: MeetingStatus) => {
    await supabase.from('sf_meetings').update({ status: newStatus }).eq('id', meetingId);
  };

  if (loading) return <div className="text-dim text-sm">Loading meetings...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">SF Meetings</h1>
          <p className="text-muted text-sm mt-1">Spring break meeting pipeline</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-3 py-1.5 text-xs bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors"
        >
          + Add Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6">
        <div className="bg-card border border-border rounded px-4 py-2.5">
          <span className="text-xs text-dim">Pipeline: </span>
          <span className="text-sm font-mono text-text">{stats.total}</span>
        </div>
        <div className="bg-card border border-border rounded px-4 py-2.5">
          <span className="text-xs text-dim">Confirmed: </span>
          <span className="text-sm font-mono text-emerald-700">{stats.confirmed}</span>
        </div>
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="bg-card border border-border rounded px-4 py-2.5 flex items-center gap-2">
            <Badge value={type} />
            <span className="text-sm font-mono text-text">{count}</span>
          </div>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map(col => {
          const colMeetings = meetings.filter(m => m.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-surface border border-border rounded min-w-[200px] flex-shrink-0"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (dragMeeting) {
                  moveMeeting(dragMeeting, col.status);
                  setDragMeeting(null);
                }
              }}
            >
              <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-xs text-muted font-medium">{col.label}</span>
                <span className="text-xs font-mono text-dim">{colMeetings.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[150px]">
                {colMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    draggable
                    onDragStart={() => setDragMeeting(meeting.id)}
                    onDragEnd={() => setDragMeeting(null)}
                    onClick={() => setEditMeeting(meeting)}
                    className={`bg-card border border-border rounded p-3 cursor-pointer hover:border-dim transition-colors ${
                      dragMeeting === meeting.id ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="text-sm text-text mb-1">{meeting.contact_name}</p>
                    {meeting.company_or_fund && (
                      <p className="text-xs text-muted mb-1.5">{meeting.company_or_fund}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge value={meeting.meeting_type} />
                      <span className="text-xs text-dim">{meeting.owner}</span>
                    </div>
                    {meeting.scheduled_date && (
                      <p className="text-xs font-mono text-dim mt-1.5">{formatDatetimeET(meeting.scheduled_date)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <MeetingFormModal
        open={addOpen || !!editMeeting}
        onClose={() => { setAddOpen(false); setEditMeeting(null); }}
        user={user}
        existing={editMeeting}
      />
    </div>
  );
}

function MeetingFormModal({
  open, onClose, user, existing,
}: {
  open: boolean;
  onClose: () => void;
  user: TeamMember | null;
  existing: SFMeeting | null;
}) {
  const [contactName, setContactName] = useState(existing?.contact_name || '');
  const [contactRole, setContactRole] = useState(existing?.contact_role || '');
  const [companyOrFund, setCompanyOrFund] = useState(existing?.company_or_fund || '');
  const [meetingType, setMeetingType] = useState<MeetingType>(existing?.meeting_type || 'vc');
  const [status, setStatus] = useState<MeetingStatus>(existing?.status || 'need_intro');
  const [introThrough, setIntroThrough] = useState(existing?.intro_through || '');
  const [owner, setOwner] = useState<TeamMember>(existing?.owner || user || 'Adham');
  const [scheduledDate, setScheduledDate] = useState(existing?.scheduled_date ? existing.scheduled_date.slice(0, 16) : '');
  const [location, setLocation] = useState(existing?.location || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  if ((existing?.id || null) !== lastId) {
    setLastId(existing?.id || null);
    setContactName(existing?.contact_name || '');
    setContactRole(existing?.contact_role || '');
    setCompanyOrFund(existing?.company_or_fund || '');
    setMeetingType(existing?.meeting_type || 'vc');
    setStatus(existing?.status || 'need_intro');
    setIntroThrough(existing?.intro_through || '');
    setOwner(existing?.owner || user || 'Adham');
    setScheduledDate(existing?.scheduled_date ? existing.scheduled_date.slice(0, 16) : '');
    setLocation(existing?.location || '');
    setNotes(existing?.notes || '');
  }

  const handleSubmit = async () => {
    if (!contactName.trim() || !user) return;
    setSubmitting(true);

    const payload = {
      contact_name: contactName.trim(),
      contact_role: contactRole.trim() || null,
      company_or_fund: companyOrFund.trim() || null,
      meeting_type: meetingType,
      status,
      intro_through: introThrough.trim() || null,
      owner,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      location: location.trim() || null,
      notes: notes.trim() || null,
    };

    if (existing) {
      await supabase.from('sf_meetings').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('sf_meetings').insert(payload);
    }

    setSubmitting(false);
    setContactName('');
    setContactRole('');
    setCompanyOrFund('');
    setIntroThrough('');
    setScheduledDate('');
    setLocation('');
    setNotes('');
    onClose();
  };

  const handleDelete = async () => {
    if (existing) {
      await supabase.from('sf_meetings').delete().eq('id', existing.id);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Meeting' : 'Add Meeting'} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Contact Name *</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Company / Fund</label>
            <input value={companyOrFund} onChange={e => setCompanyOrFund(e.target.value)} className="w-full" placeholder="a16z, YC, ..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Role</label>
            <input value={contactRole} onChange={e => setContactRole(e.target.value)} className="w-full" placeholder="Partner, Founder, ..." />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Meeting Type</label>
            <select value={meetingType} onChange={e => setMeetingType(e.target.value as MeetingType)} className="w-full">
              <option value="vc">VC</option>
              <option value="angel">Angel</option>
              <option value="operator">Operator</option>
              <option value="accelerator">Accelerator</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as MeetingStatus)} className="w-full">
              {PIPELINE_COLUMNS.map(col => (
                <option key={col.status} value={col.status}>{col.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Owner</label>
            <select value={owner} onChange={e => setOwner(e.target.value as TeamMember)} className="w-full">
              <option value="Adham">Adham</option>
              <option value="Aly">Aly</option>
              <option value="Youssif">Youssif</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Intro Through</label>
            <input value={introThrough} onChange={e => setIntroThrough(e.target.value)} className="w-full" placeholder="Who's making the intro" />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Scheduled Date/Time</label>
            <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full" />
          </div>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className="w-full" placeholder="Coffee shop, Zoom, ..." />
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-20 resize-none" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!contactName.trim() || submitting}
            className="flex-1 py-2 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : existing ? 'Update Meeting' : 'Add Meeting'}
          </button>
          {existing && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-600 border border-red-600/20 rounded hover:bg-red-600/10 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
