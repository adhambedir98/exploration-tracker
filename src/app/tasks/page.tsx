'use client';

import { useState, useMemo } from 'react';
import { useTasks, useVerticals } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Task, TaskStatus, TaskPhase, TeamMember } from '@/lib/types';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { formatDateET } from '@/lib/utils';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

export default function TasksPage() {
  const { data: tasks, loading } = useTasks();
  const { data: verticals } = useVerticals();
  const { user } = useUser();

  const [filterPerson, setFilterPerson] = useState<TeamMember | 'all'>('all');
  const [filterPhase, setFilterPhase] = useState<TaskPhase | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addToColumn, setAddToColumn] = useState<TaskStatus>('todo');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [dragTask, setDragTask] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    if (filterPerson !== 'all') filtered = filtered.filter(t => t.assigned_to === filterPerson);
    if (filterPhase !== 'all') filtered = filtered.filter(t => t.phase === filterPhase);
    return filtered;
  }, [tasks, filterPerson, filterPhase]);

  const verticalMap = Object.fromEntries(verticals.map(v => [v.id, v.name]));

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  };

  if (loading) return <div className="text-dim text-sm">Loading tasks...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Tasks</h1>
          <p className="text-muted text-sm mt-1">{tasks.length} total tasks</p>
        </div>
        <button
          onClick={() => { setAddToColumn('todo'); setAddOpen(true); }}
          className="px-3 py-1.5 text-xs bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dim">Person:</span>
          {(['all', 'Adham', 'Aly', 'Youssif'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPerson(p)}
              className={`px-2 py-0.5 text-xs rounded ${filterPerson === p ? 'bg-card text-text border border-border' : 'text-dim hover:text-muted'}`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dim">Phase:</span>
          {(['all', 'phase_1', 'phase_2', 'phase_3', 'parallel'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPhase(p)}
              className={`px-2 py-0.5 text-xs rounded ${filterPhase === p ? 'bg-card text-text border border-border' : 'text-dim hover:text-muted'}`}
            >
              {p === 'all' ? 'All' : p === 'phase_1' ? 'P1' : p === 'phase_2' ? 'P2' : p === 'phase_3' ? 'P3' : 'Par'}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-surface border border-border rounded"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (dragTask) {
                  moveTask(dragTask, col.status);
                  setDragTask(null);
                }
              }}
            >
              <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text font-medium">{col.label}</span>
                  <span className="text-xs font-mono text-dim">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => { setAddToColumn(col.status); setAddOpen(true); }}
                  className="text-dim hover:text-muted text-lg leading-none"
                >
                  +
                </button>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragTask(task.id)}
                    onDragEnd={() => setDragTask(null)}
                    onClick={() => setEditTask(task)}
                    className={`bg-card border border-border rounded p-3 cursor-pointer hover:border-dim transition-colors ${
                      dragTask === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="text-sm text-text mb-2">{task.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted">{task.assigned_to}</span>
                      <Badge value={task.phase} />
                      {task.vertical_id && verticalMap[task.vertical_id] && (
                        <span className="text-xs text-dim truncate max-w-[100px]">{verticalMap[task.vertical_id]}</span>
                      )}
                    </div>
                    {task.due_date && (
                      <p className="text-xs font-mono text-dim mt-1.5">{formatDateET(task.due_date, 'MMM d')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormModal
        open={addOpen || !!editTask}
        onClose={() => { setAddOpen(false); setEditTask(null); }}
        user={user}
        verticals={verticals}
        defaultStatus={addToColumn}
        existing={editTask}
      />
    </div>
  );
}

function TaskFormModal({
  open, onClose, user, verticals, defaultStatus, existing,
}: {
  open: boolean;
  onClose: () => void;
  user: TeamMember | null;
  verticals: { id: string; name: string }[];
  defaultStatus: TaskStatus;
  existing: Task | null;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [assignedTo, setAssignedTo] = useState<TeamMember>(existing?.assigned_to || user || 'Adham');
  const [phase, setPhase] = useState<TaskPhase>(existing?.phase || 'phase_1');
  const [dueDate, setDueDate] = useState(existing?.due_date || '');
  const [status, setStatus] = useState<TaskStatus>(existing?.status || defaultStatus);
  const [verticalId, setVerticalId] = useState(existing?.vertical_id || '');
  const [submitting, setSubmitting] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  if ((existing?.id || null) !== lastId) {
    setLastId(existing?.id || null);
    setTitle(existing?.title || '');
    setDescription(existing?.description || '');
    setAssignedTo(existing?.assigned_to || user || 'Adham');
    setPhase(existing?.phase || 'phase_1');
    setDueDate(existing?.due_date || '');
    setStatus(existing?.status || defaultStatus);
    setVerticalId(existing?.vertical_id || '');
  }

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo,
      phase,
      due_date: dueDate || null,
      status,
      vertical_id: verticalId || null,
    };

    if (existing) {
      await supabase.from('tasks').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('tasks').insert(payload);
    }

    setSubmitting(false);
    setTitle('');
    setDescription('');
    setDueDate('');
    setVerticalId('');
    onClose();
  };

  const handleDelete = async () => {
    if (existing) {
      await supabase.from('tasks').delete().eq('id', existing.id);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Task' : 'Add Task'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-dim block mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full" placeholder="Task title..." />
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-16 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Assigned To</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value as TeamMember)} className="w-full">
              <option value="Adham">Adham</option>
              <option value="Aly">Aly</option>
              <option value="Youssif">Youssif</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Phase</label>
            <select value={phase} onChange={e => setPhase(e.target.value as TaskPhase)} className="w-full">
              <option value="phase_1">Phase 1</option>
              <option value="phase_2">Phase 2</option>
              <option value="phase_3">Phase 3</option>
              <option value="parallel">Parallel</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="w-full">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Linked Vertical</label>
          <select value={verticalId} onChange={e => setVerticalId(e.target.value)} className="w-full">
            <option value="">None</option>
            {verticals.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="flex-1 py-2 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : existing ? 'Update Task' : 'Add Task'}
          </button>
          {existing && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-400 border border-red-400/20 rounded hover:bg-red-400/10 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
