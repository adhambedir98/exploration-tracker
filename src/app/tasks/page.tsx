'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Task, TaskStatus, TeamMember } from '@/lib/types';
import Modal from '@/components/Modal';
import { formatDateET } from '@/lib/utils';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

export default function TasksPage() {
  const { data: tasks, loading } = useTasks();
  const { user } = useUser();

  const [filterPerson, setFilterPerson] = useState<TeamMember | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addToColumn, setAddToColumn] = useState<TaskStatus>('todo');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [dragTask, setDragTask] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    if (filterPerson !== 'all') filtered = filtered.filter(t => t.assigned_to === filterPerson);
    return filtered;
  }, [tasks, filterPerson]);

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
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

      {/* Person Filter */}
      <div className="flex items-center gap-2 mb-5">
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
                    <p className="text-sm text-text mb-1.5">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">{task.assigned_to}</span>
                      {task.due_date && (
                        <span className={`text-xs font-mono ${isOverdue(task.due_date) && col.status !== 'done' ? 'text-red-500' : 'text-dim'}`}>
                          {formatDateET(task.due_date, 'MMM d')}
                        </span>
                      )}
                    </div>
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
        defaultStatus={addToColumn}
        existing={editTask}
      />
    </div>
  );
}

function TaskFormModal({
  open, onClose, user, defaultStatus, existing,
}: {
  open: boolean;
  onClose: () => void;
  user: TeamMember | null;
  defaultStatus: TaskStatus;
  existing: Task | null;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [assignedTo, setAssignedTo] = useState<TeamMember>(existing?.assigned_to || user || 'Adham');
  const [dueDate, setDueDate] = useState(existing?.due_date || '');
  const [status, setStatus] = useState<TaskStatus>(existing?.status || defaultStatus);
  const [submitting, setSubmitting] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  if ((existing?.id || null) !== lastId) {
    setLastId(existing?.id || null);
    setTitle(existing?.title || '');
    setAssignedTo(existing?.assigned_to || user || 'Adham');
    setDueDate(existing?.due_date || '');
    setStatus(existing?.status || defaultStatus);
  }

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      assigned_to: assignedTo,
      due_date: dueDate || null,
      status,
    };

    if (existing) {
      await supabase.from('tasks').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('tasks').insert(payload);
    }

    setSubmitting(false);
    setTitle('');
    setDueDate('');
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
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full" placeholder="What needs to be done?" />
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
            <label className="text-xs text-dim block mb-1">Deadline</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full" />
          </div>
        </div>
        {existing && (
          <div>
            <label className="text-xs text-dim block mb-1">Stage</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="w-full">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        )}
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
