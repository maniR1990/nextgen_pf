'use client';

import { Button } from '@/components/ui/Button';
import {
  useAddActivityItem,
  useProjectDetail,
  useRemoveActivityItem,
  useUpdateActivityItem,
} from '@/hooks/useProjects';
import type { ActivityNoteSummary, ProjectNoteTag } from '@/hooks/useProjects';
import { Square, SquareCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface ProjectActivityProps {
  projectId: string;
}

const NOTE_TAG_LABEL: Record<ProjectNoteTag, string> = {
  PROGRESS: 'progress',
  DECISION: 'decision',
  DELIVERY: 'delivery',
  ON_HOLD: 'on hold',
  ISSUE: 'issue',
  CONTACT: 'contact',
  RETURN: 'return',
  MISC: 'misc',
};

// Lowercased/kebab-cased so it doubles as the CSS modifier suffix
// (project-activity__note-row--progress, --on-hold, ...).
const NOTE_TAG_VARIANT: Record<ProjectNoteTag, string> = {
  PROGRESS: 'progress',
  DECISION: 'decision',
  DELIVERY: 'delivery',
  ON_HOLD: 'on-hold',
  ISSUE: 'issue',
  CONTACT: 'contact',
  RETURN: 'return',
  MISC: 'misc',
};

// Most recent entries only, by default — a project's activity log tops out
// at tens of entries, not the volume the monthly transaction list handles,
// so a plain "show earlier" reveal is enough; no pagination machinery needed.
const TIMELINE_VISIBLE_LIMIT = 15;

// Same set the note-tag picker offers (RETURN excluded — unreachable from
// this form, see the design review note on it).
const FILTER_TAGS = (Object.keys(NOTE_TAG_LABEL) as ProjectNoteTag[]).filter(
  (tag) => tag !== 'RETURN',
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function groupNotesByDate(notes: ActivityNoteSummary[]) {
  const groups: { date: string; notes: ActivityNoteSummary[] }[] = [];
  for (const note of notes) {
    const date = formatDate(note.date);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.notes.push(note);
    } else {
      groups.push({ date, notes: [note] });
    }
  }
  return groups;
}

export function ProjectActivity({ projectId }: ProjectActivityProps) {
  const { data: project, isLoading } = useProjectDetail(projectId);
  const addItem = useAddActivityItem(projectId);
  const updateItem = useUpdateActivityItem(projectId);
  const removeItem = useRemoveActivityItem(projectId);

  const [todoText, setTodoText] = useState('');
  const [showDoneTodos, setShowDoneTodos] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTag, setNoteTag] = useState<ProjectNoteTag>('PROGRESS');
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [noteFilter, setNoteFilter] = useState<ProjectNoteTag | 'ALL'>('ALL');
  const [refKey, setRefKey] = useState('');
  const [refValue, setRefValue] = useState('');
  const [refVendorId, setRefVendorId] = useState('');

  if (isLoading) return <p className="page-text">Loading…</p>;
  if (!project) return <p className="page-text">Project not found.</p>;

  async function addTodo() {
    if (!todoText.trim()) return;
    await addItem.mutateAsync({ kind: 'todo', text: todoText.trim() });
    setTodoText('');
  }

  async function addNote() {
    if (!noteText.trim()) return;
    await addItem.mutateAsync({ kind: 'note', text: noteText.trim(), tag: noteTag });
    setNoteText('');
    setNoteTag('PROGRESS');
  }

  async function addReference() {
    if (!refKey.trim() || !refValue.trim()) return;
    await addItem.mutateAsync({
      kind: 'reference',
      key: refKey.trim(),
      value: refValue.trim(),
      ...(refVendorId && { vendorId: refVendorId }),
    });
    setRefKey('');
    setRefValue('');
    setRefVendorId('');
  }

  const openTodos = project.todos.filter((t) => !t.done);
  const doneTodos = project.todos.filter((t) => t.done);

  const notesSorted = project.activityNotes
    .filter((note) => noteFilter === 'ALL' || note.tag === noteFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const hasEarlierNotes = notesSorted.length > TIMELINE_VISIBLE_LIMIT;
  const visibleNotes = timelineExpanded
    ? notesSorted
    : notesSorted.slice(0, TIMELINE_VISIBLE_LIMIT);
  const noteGroups = groupNotesByDate(visibleNotes);

  return (
    <div className="project-activity">
      <section className="project-activity__section project-activity__section--checklist">
        <span className="project-overview__field-label">Checklist</span>
        <p className="project-activity__section-hint">Things to do</p>

        <div className="project-activity__add-row">
          <input
            type="text"
            className="select-field__control"
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            placeholder="Add a to-do"
          />
          <Button variant="secondary" size="sm" onClick={addTodo} disabled={!todoText.trim()}>
            Add
          </Button>
        </div>

        <div className="project-activity__list">
          {openTodos.map((todo) => (
            <div key={todo.id} className="project-activity__todo-row">
              <button
                type="button"
                className="project-activity__todo-toggle"
                onClick={() => updateItem.mutate({ itemId: todo.id, done: !todo.done })}
                aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
              >
                <Square size={16} aria-hidden />
              </button>
              <span className="project-activity__todo-text">{todo.text}</span>
              <button
                type="button"
                className="project-forecast-line-row__remove"
                onClick={() => removeItem.mutate(todo.id)}
                aria-label={`Remove ${todo.text}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
          {openTodos.length === 0 && doneTodos.length === 0 && (
            <p className="page-text">No to-dos yet.</p>
          )}
        </div>

        {doneTodos.length > 0 && (
          <>
            <button
              type="button"
              className="project-activity__disclosure"
              onClick={() => setShowDoneTodos((v) => !v)}
              aria-expanded={showDoneTodos}
            >
              {showDoneTodos ? '▾' : '▸'} {doneTodos.length} completed
            </button>
            {showDoneTodos && (
              <div className="project-activity__list">
                {doneTodos.map((todo) => (
                  <div key={todo.id} className="project-activity__todo-row">
                    <button
                      type="button"
                      className="project-activity__todo-toggle"
                      onClick={() => updateItem.mutate({ itemId: todo.id, done: !todo.done })}
                      aria-label="Mark as not done"
                    >
                      <SquareCheck size={16} aria-hidden />
                    </button>
                    <span className="project-activity__todo-text project-activity__todo-text--done">
                      {todo.text}
                    </span>
                    <button
                      type="button"
                      className="project-forecast-line-row__remove"
                      onClick={() => removeItem.mutate(todo.id)}
                      aria-label={`Remove ${todo.text}`}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="project-activity__section project-activity__section--timeline">
        <span className="project-overview__field-label">Timeline</span>
        <p className="project-activity__section-hint">What's happened, in order</p>

        <div className="project-activity__note-add">
          <input
            type="text"
            className="select-field__control"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What happened?"
          />
          <select
            className="select-field__control"
            value={noteTag}
            onChange={(e) => setNoteTag(e.target.value as ProjectNoteTag)}
          >
            {(Object.keys(NOTE_TAG_LABEL) as ProjectNoteTag[])
              .filter((tag) => tag !== 'RETURN')
              .map((tag) => (
                <option key={tag} value={tag}>
                  {NOTE_TAG_LABEL[tag]}
                </option>
              ))}
          </select>
          <Button variant="secondary" size="sm" onClick={addNote} disabled={!noteText.trim()}>
            Add
          </Button>
        </div>

        <div
          className="project-activity__timeline-filters"
          role="group"
          aria-label="Filter by kind"
        >
          <button
            type="button"
            className={`chip project-activity__timeline-filter ${noteFilter === 'ALL' ? 'project-activity__timeline-filter--active' : ''}`}
            aria-pressed={noteFilter === 'ALL'}
            onClick={() => setNoteFilter('ALL')}
          >
            All
          </button>
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip project-activity__timeline-filter ${noteFilter === tag ? 'project-activity__timeline-filter--active' : ''}`}
              aria-pressed={noteFilter === tag}
              onClick={() => setNoteFilter(tag)}
            >
              {NOTE_TAG_LABEL[tag]}
            </button>
          ))}
        </div>

        <div className="project-activity__timeline">
          {noteGroups.map((group) => (
            <div key={group.date} className="project-activity__timeline-group">
              <span className="project-activity__timeline-date">{group.date}</span>
              <div className="project-activity__list">
                {group.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`project-activity__note-row project-activity__note-row--${NOTE_TAG_VARIANT[note.tag]}`}
                  >
                    <div className="project-activity__note-meta">
                      <span
                        className={`chip project-activity__note-tag project-activity__note-tag--${NOTE_TAG_VARIANT[note.tag]}`}
                      >
                        {NOTE_TAG_LABEL[note.tag]}
                      </span>
                      <button
                        type="button"
                        className="project-forecast-line-row__remove"
                        onClick={() => removeItem.mutate(note.id)}
                        aria-label="Remove note"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                    <p className="project-activity__note-text">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {notesSorted.length === 0 && (
            <p className="page-text">
              {noteFilter === 'ALL'
                ? 'Nothing logged yet.'
                : `No ${NOTE_TAG_LABEL[noteFilter]} entries.`}
            </p>
          )}
        </div>

        {hasEarlierNotes && !timelineExpanded && (
          <button
            type="button"
            className="project-activity__disclosure"
            onClick={() => setTimelineExpanded(true)}
          >
            Show earlier activity
          </button>
        )}
      </section>

      <section className="project-activity__section project-activity__section--reference">
        <span className="project-overview__field-label">Reference details</span>
        <p className="project-activity__section-hint">
          Facts you'll want later — a contact, an order ID, a gate code
        </p>
        <div className="project-activity__ref-add">
          <input
            type="text"
            className="select-field__control"
            value={refKey}
            onChange={(e) => setRefKey(e.target.value)}
            placeholder="Key, e.g. Site supervisor"
          />
          <input
            type="text"
            className="select-field__control"
            value={refValue}
            onChange={(e) => setRefValue(e.target.value)}
            placeholder="Value"
          />
          {project.vendors.length > 0 && (
            <select
              className="select-field__control"
              value={refVendorId}
              onChange={(e) => setRefVendorId(e.target.value)}
            >
              <option value="">No vendor</option>
              {project.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={addReference}
            disabled={!refKey.trim() || !refValue.trim()}
          >
            Add
          </Button>
        </div>

        <div className="project-activity__list">
          {project.references.map((ref) => (
            <div key={ref.id} className="project-vendor-row">
              <div>
                <div className="project-vendor-row__name">{ref.key}</div>
                <div className="project-activity__ref-value">
                  {ref.value}
                  {ref.vendorLabel && ` · ${ref.vendorLabel}`}
                </div>
              </div>
              <button
                type="button"
                className="project-forecast-line-row__remove"
                onClick={() => removeItem.mutate(ref.id)}
                aria-label={`Remove ${ref.key}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
          {project.references.length === 0 && <p className="page-text">No references yet.</p>}
        </div>
      </section>
    </div>
  );
}
