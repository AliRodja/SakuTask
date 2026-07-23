import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Check,
  Trash2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  MessageCircle,
  Tags,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { formatDateOnly } from '../lib/format';

const WEEKDAY_LABELS = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

const CATEGORY_COLORS = [
  { text: '#818cf8', bg: 'rgba(129,140,248,0.14)' },
  { text: '#38bdf8', bg: 'rgba(56,189,248,0.14)' },
  { text: '#a78bfa', bg: 'rgba(167,139,250,0.14)' },
  { text: '#fb923c', bg: 'rgba(251,146,60,0.14)' },
  { text: '#f472b6', bg: 'rgba(244,114,182,0.14)' },
  { text: '#34d399', bg: 'rgba(52,211,153,0.14)' },
];

function categoryColorIndex(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % CATEGORY_COLORS.length;
}

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function todoDateTime(todo) {
  const dateStr = formatDateOnly(todo.due_date);
  const time = (todo.reminder_time || '00:00:00').slice(0, 5);
  return new Date(`${dateStr}T${time}:00`);
}

function relativeTimeUntil(target, now) {
  const diffMs = target - now;
  if (diffMs <= 0) return 'Sekarang';
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `Dalam ${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Dalam ${hours} jam`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Besok';
  return `Dalam ${days} hari`;
}

export default function Todos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [form, setForm] = useState({ task_name: '', category: '', reminder_time: '' });
  const [error, setError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const taskNameRef = useRef(null);
  const categoryInputRef = useRef(null);

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    setLoading(true);
    try {
      const { data } = await api.get('/todos');
      setTodos(data);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/todos', {
        task_name: form.task_name,
        category: form.category || null,
        due_date: formatDateOnly(selectedDate),
        reminder_time: form.reminder_time,
      });
      setForm({ task_name: '', category: form.category, reminder_time: '' });
      await loadTodos();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(todo) {
    const newStatus = todo.status === 'pending' ? 'completed' : 'pending';
    await api.put(`/todos/${todo.id}`, { status: newStatus });
    loadTodos();
  }

  async function removeTodo(id) {
    await api.delete(`/todos/${id}`);
    loadTodos();
  }

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const monthLabel = weekStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const categoryHistory = useMemo(() => {
    const seen = new Set();
    const list = [];
    todos.forEach((t) => {
      if (t.category && !seen.has(t.category)) {
        seen.add(t.category);
        list.push(t.category);
      }
    });
    return list;
  }, [todos]);

  const categoryQuery = form.category.trim();
  const filteredCategories = categoryQuery
    ? categoryHistory.filter((c) => c.toLowerCase().includes(categoryQuery.toLowerCase()))
    : categoryHistory;

  const tasksForSelectedDate = useMemo(
    () => todos.filter((t) => isSameDay(new Date(formatDateOnly(t.due_date) + 'T00:00:00'), selectedDate)),
    [todos, selectedDate]
  );

  const allTasksSorted = useMemo(
    () => [...todos].sort((a, b) => todoDateTime(a) - todoDateTime(b)),
    [todos]
  );

  const displayedTasks = showAll ? allTasksSorted : tasksForSelectedDate;
  const doneCount = tasksForSelectedDate.filter((t) => t.status === 'completed').length;
  const totalCount = tasksForSelectedDate.length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const isToday = isSameDay(selectedDate, new Date());
  const selectedDateLabel = isToday
    ? 'Fokus Hari Ini'
    : `Fokus ${selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`;
  const firstName = user?.name?.split(' ')[0] || 'kamu';
  const remaining = totalCount - doneCount;
  const progressMessage =
    totalCount === 0
      ? `Belum ada tugas untuk tanggal ini. Tambahkan tugas pertamamu, ${firstName}!`
      : remaining === 0
      ? `Kerja bagus, ${firstName}! Semua tugas hari ini selesai.`
      : `Kerja bagus, ${firstName}! ${remaining} tugas lagi untuk mencapai target harianmu.`;

  const categoryCounts = useMemo(() => {
    const counts = {};
    todos.forEach((t) => {
      if (t.category) counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [todos]);

  const nextReminder = useMemo(() => {
    const now = new Date();
    return todos
      .filter((t) => t.status === 'pending')
      .map((t) => ({ todo: t, at: todoDateTime(t) }))
      .filter((x) => x.at >= now)
      .sort((a, b) => a.at - b.at)[0];
  }, [todos]);

  function focusTaskName() {
    taskNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    taskNameRef.current?.focus();
  }

  function focusCategory() {
    categoryInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    categoryInputRef.current?.focus();
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="todo-root">
      <div className="todo-header">
        <h2 className="todo-title">Manajemen Tugas</h2>
        <div className="todo-header-actions">
          <button onClick={() => navigate('/notifications')} className="todo-icon-btn">
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={focusTaskName} className="gradient-btn text-sm px-3 py-1.5">
            <Plus className="w-4 h-4" /> <span>Tugas Baru</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="app-error" role="alert">
          <div className="app-error-dot" />
          <span>{error}</span>
        </div>
      )}

      {/* Calendar strip */}
      <div className="glass-card todo-calendar">
        <div className="todo-calendar-header">
          <p className="todo-month">{monthLabel}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart((d) => addDays(d, -7))} className="todo-page-btn">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="todo-page-btn">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="todo-week-grid">
          {weekDays.map((d, i) => {
            const active = isSameDay(d, selectedDate);
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(d);
                  setShowAll(false);
                }}
                className={`todo-day-btn ${active ? 'todo-day-btn-active' : ''}`}
              >
                <span className="todo-day-label">{WEEKDAY_LABELS[i]}</span>
                <span className="todo-day-number">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick add */}
      <form onSubmit={handleSubmit} className="glass-card todo-quickadd">
        <div className="todo-quickadd-field todo-quickadd-name">
          <label className="todo-field-label">Tambah Tugas Cepat</label>
          <input
            ref={taskNameRef}
            placeholder="Apa yang harus dikerjakan?"
            value={form.task_name}
            onChange={(e) => setForm({ ...form, task_name: e.target.value })}
            className="app-input"
            required
          />
        </div>

        <div className="todo-quickadd-field todo-quickadd-category">
          <label className="todo-field-label">Kategori</label>
          <div className="todo-combobox">
            <Search className="w-4 h-4 todo-combobox-icon" />
            <input
              ref={categoryInputRef}
              type="text"
              value={form.category}
              onChange={(e) => {
                setForm({ ...form, category: e.target.value });
                setCategoryOpen(true);
              }}
              onFocus={() => setCategoryOpen(true)}
              onBlur={() => setCategoryOpen(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setCategoryOpen(false); }}
              placeholder="Opsional..."
              className="app-input todo-combobox-input"
              autoComplete="off"
            />
            {categoryOpen && (
              <ul className="todo-combobox-list">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setForm({ ...form, category: c });
                          setCategoryOpen(false);
                        }}
                        className={`todo-combobox-option ${c === form.category ? 'todo-combobox-option-active' : ''}`}
                      >
                        {c}
                      </button>
                    </li>
                  ))
                ) : categoryQuery ? (
                  <li className="todo-combobox-empty">Kategori baru: "{categoryQuery}"</li>
                ) : (
                  <li className="todo-combobox-empty">Belum ada kategori. Ketik untuk membuat baru.</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="todo-quickadd-field todo-quickadd-time">
          <label className="todo-field-label">Pengingat WhatsApp</label>
          <input
            type="time"
            value={form.reminder_time}
            onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
            className="app-input"
            required
          />
        </div>

        <button type="submit" disabled={submitting} className="gradient-btn todo-quickadd-submit">
          <span>{submitting ? 'Menjadwalkan...' : 'Jadwalkan'}</span>
        </button>
      </form>

      {loading ? (
        <Spinner label="Memuat tugas..." />
      ) : (
        <div className="todo-main-grid">
          <div className="glass-card todo-list-card">
            <div className="todo-list-header">
              <h3 className="todo-list-title">
                {showAll ? 'Semua Tugas' : selectedDateLabel} <span className="todo-list-count">({displayedTasks.length})</span>
              </h3>
              <button onClick={() => setShowAll((v) => !v)} className="todo-see-all">
                {showAll ? 'Fokus Hari Ini' : 'Lihat Semua'}
              </button>
            </div>

            <div className="todo-list">
              {displayedTasks.map((todo) => {
                const dt = todoDateTime(todo);
                const colorIdx = todo.category ? categoryColorIndex(todo.category) : null;
                const pill = colorIdx !== null ? CATEGORY_COLORS[colorIdx] : null;
                return (
                  <div key={todo.id} className="todo-item">
                    <button
                      onClick={() => toggleStatus(todo)}
                      className={`todo-check ${todo.status === 'completed' ? 'todo-check-done' : ''}`}
                    >
                      {todo.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="todo-item-body">
                      <p className={`todo-item-name ${todo.status === 'completed' ? 'todo-item-name-done' : ''}`}>
                        {todo.task_name}
                      </p>
                      <div className="todo-item-meta">
                        {pill && (
                          <span className="todo-cat-pill" style={{ color: pill.text, background: pill.bg }}>
                            {todo.category.toUpperCase()}
                          </span>
                        )}
                        <span className="todo-item-date">
                          <Clock className="w-3 h-3" />
                          {showAll && formatDateOnly(todo.due_date)} {dt.toTimeString().slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    <span className="todo-wa-pill">
                      <Bell className="w-3 h-3" /> WA: {todo.reminder_time?.slice(0, 5)} WIB
                    </span>

                    <button onClick={() => removeTodo(todo.id)} className="todo-delete-btn">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {displayedTasks.length === 0 && (
                <p className="text-sm text-faint text-center py-8">
                  {showAll ? 'Belum ada tugas.' : 'Tidak ada tugas untuk tanggal ini.'}
                </p>
              )}
            </div>
          </div>

          <div className="todo-sidebar">
            <div className="todo-progress-card">
              <div className="todo-progress-glow" />
              <div className="todo-progress-content">
                <p className="todo-progress-label">Progres Harian</p>
                <div className="todo-progress-pct-row">
                  <span className="todo-progress-pct">{progressPct}%</span>
                  <span className="todo-progress-selesai">Selesai</span>
                </div>
                <div className="todo-progress-track">
                  <div className="todo-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="todo-progress-msg">{progressMessage}</p>
              </div>
            </div>

            <div className="glass-card todo-category-card">
              <p className="todo-sidebar-title">Kategori</p>
              {categoryCounts.length === 0 ? (
                <p className="text-xs text-faint py-2">Belum ada kategori.</p>
              ) : (
                <div className="todo-category-list">
                  {categoryCounts.map(([category, count]) => {
                    const color = CATEGORY_COLORS[categoryColorIndex(category)];
                    return (
                      <div key={category} className="todo-category-row">
                        <span className="todo-category-dot" style={{ background: color.text }} />
                        <span className="todo-category-name">{category}</span>
                        <span className="todo-category-count">{count} Tugas</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={focusCategory} className="todo-manage-btn">
                <Tags className="w-3.5 h-3.5" /> Kelola Kategori
              </button>
            </div>

            <div className="glass-card todo-next-card">
              <p className="todo-sidebar-title">Peringatan Berikutnya</p>
              {nextReminder ? (
                <div className="todo-next-row">
                  <div className="todo-next-icon">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="todo-next-name">{nextReminder.todo.task_name}</p>
                    <p className="todo-next-time">{relativeTimeUntil(nextReminder.at, new Date())}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-faint py-2">Tidak ada pengingat mendatang.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{todoStyles}</style>
    </div>
  );
}

const todoStyles = `
  .todo-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .todo-field-label {
    display: block;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(var(--ink-rgb),0.4);
    margin-bottom: 6px;
  }

  .todo-combobox {
    position: relative;
  }
  .todo-combobox-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(var(--ink-rgb),0.35);
    pointer-events: none;
  }
  .todo-combobox-input {
    padding-left: 40px;
  }
  .todo-combobox-list {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 20;
    margin: 0;
    padding: 6px;
    list-style: none;
    max-height: 220px;
    overflow-y: auto;
    background: rgba(var(--card-rgb), 0.98);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(var(--ink-rgb),0.1);
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  }
  .todo-combobox-option {
    display: block;
    width: 100%;
    text-align: left;
    padding: 9px 12px;
    border-radius: 8px;
    border: none;
    background: none;
    font-size: 0.875rem;
    font-family: 'Inter', sans-serif;
    color: rgba(var(--ink-rgb),0.75);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .todo-combobox-option:hover {
    background: rgba(99,102,241,0.14);
    color: rgba(var(--ink-rgb),0.95);
  }
  .todo-combobox-option-active {
    background: rgba(99,102,241,0.18);
    color: var(--ink-solid);
    font-weight: 600;
  }
  .todo-combobox-empty {
    padding: 9px 12px;
    font-size: 0.8125rem;
    color: rgba(var(--ink-rgb),0.4);
    font-style: italic;
  }

  .todo-cat-pill {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 99px;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .todo-delete-btn {
    color: rgba(var(--ink-rgb),0.25);
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .todo-delete-btn:hover { color: #fb7185; }

  .todo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .todo-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.92);
    letter-spacing: -0.01em;
  }
  .todo-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .todo-icon-btn {
    width: 36px; height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(var(--ink-rgb),0.08);
    background: rgba(var(--ink-rgb),0.04);
    color: rgba(var(--ink-rgb),0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .todo-icon-btn:hover {
    border-color: rgba(var(--ink-rgb),0.15);
    color: rgba(var(--ink-rgb),0.85);
    background: rgba(var(--ink-rgb),0.08);
  }

  /* Calendar */
  .todo-calendar {
    padding: 20px;
  }
  .todo-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .todo-month {
    font-size: 1.0625rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.9);
  }
  .todo-page-btn {
    width: 32px; height: 32px;
    border-radius: 9px;
    border: 1px solid rgba(var(--ink-rgb),0.1);
    background: rgba(var(--ink-rgb),0.03);
    color: rgba(var(--ink-rgb),0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .todo-page-btn:hover {
    border-color: rgba(var(--ink-rgb),0.2);
    color: rgba(var(--ink-rgb),0.9);
  }
  .todo-week-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }
  .todo-day-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 4px;
    border-radius: 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .todo-day-btn:hover { background: rgba(var(--ink-rgb),0.05); }
  .todo-day-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb),0.35);
    letter-spacing: 0.02em;
  }
  .todo-day-number {
    font-size: 1.0625rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.85);
  }
  .todo-day-btn-active {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }
  .todo-day-btn-active .todo-day-label,
  .todo-day-btn-active .todo-day-number {
    color: #fff;
  }
  .todo-day-btn-active:hover { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); }

  /* Quick add */
  .todo-quickadd {
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }
  .todo-quickadd-field {
    display: flex;
    flex-direction: column;
  }
  .todo-quickadd-name { flex: 2 1 220px; }
  .todo-quickadd-category { flex: 1 1 160px; }
  .todo-quickadd-time { flex: 1 1 140px; }
  .todo-quickadd-submit {
    flex: 0 0 auto;
    padding: 12px 22px;
    font-size: 0.875rem;
  }

  /* Main grid */
  .todo-main-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 1024px) {
    .todo-main-grid { grid-template-columns: 1fr 320px; }
  }
  .todo-main-grid > * { min-width: 0; }

  .todo-list-card {
    padding: 20px;
  }
  .todo-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .todo-list-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.9);
  }
  .todo-list-count {
    font-weight: 500;
    color: rgba(var(--ink-rgb),0.35);
  }
  .todo-see-all {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary-light);
    background: none;
    border: none;
    cursor: pointer;
  }
  .todo-see-all:hover { color: var(--color-primary-lighter); }

  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(var(--ink-rgb),0.025);
    border: 1px solid rgba(var(--ink-rgb),0.05);
    flex-wrap: wrap;
  }
  .todo-check {
    width: 24px; height: 24px;
    border-radius: 50%;
    border: 1.5px solid rgba(var(--ink-rgb),0.2);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    color: transparent;
    transition: all 0.2s;
  }
  .todo-check-done {
    background: var(--color-success);
    border-color: var(--color-success);
    color: #fff;
  }
  .todo-item-body {
    flex: 1;
    min-width: 140px;
  }
  .todo-item-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb),0.85);
  }
  .todo-item-name-done {
    text-decoration: line-through;
    color: rgba(var(--ink-rgb),0.3);
  }
  .todo-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
    flex-wrap: wrap;
  }
  .todo-item-date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: rgba(var(--ink-rgb),0.4);
  }
  .todo-wa-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #34d399;
    background: rgba(52,211,153,0.14);
    white-space: nowrap;
  }

  /* Sidebar */
  .todo-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .todo-sidebar-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.88);
    margin-bottom: 12px;
  }

  .todo-progress-card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    padding: 20px;
    background: linear-gradient(135deg, #312e81, #1e1b4b 50%, #1e3a5f);
    border: 1px solid rgba(99,102,241,0.2);
  }
  .todo-progress-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(99,102,241,0.25) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 15%, rgba(56,189,248,0.15) 0%, transparent 55%);
    pointer-events: none;
  }
  .todo-progress-content { position: relative; z-index: 1; }
  .todo-progress-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.55);
    margin-bottom: 8px;
  }
  .todo-progress-pct-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 14px;
  }
  .todo-progress-pct {
    font-size: 2.25rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.03em;
  }
  .todo-progress-selesai {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.6);
    font-weight: 500;
  }
  .todo-progress-track {
    height: 8px;
    border-radius: 99px;
    background: rgba(255,255,255,0.12);
    overflow: hidden;
    margin-bottom: 14px;
  }
  .todo-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, #818cf8, #c4b5fd);
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .todo-progress-msg {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.75);
    line-height: 1.5;
  }

  .todo-category-card { padding: 18px; }
  .todo-category-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
  }
  .todo-category-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .todo-category-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .todo-category-name {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb),0.75);
  }
  .todo-category-count {
    font-size: 0.75rem;
    color: rgba(var(--ink-rgb),0.35);
  }
  .todo-manage-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border-radius: 10px;
    border: 1.5px dashed rgba(var(--ink-rgb),0.15);
    background: none;
    color: rgba(var(--ink-rgb),0.45);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .todo-manage-btn:hover {
    border-color: rgba(var(--ink-rgb),0.3);
    color: rgba(var(--ink-rgb),0.8);
  }

  .todo-next-card { padding: 18px; }
  .todo-next-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .todo-next-icon {
    width: 42px; height: 42px;
    border-radius: 13px;
    background: linear-gradient(135deg, #34d399, #10b981);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .todo-next-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb),0.85);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .todo-next-time {
    font-size: 0.75rem;
    color: rgba(var(--ink-rgb),0.4);
    margin-top: 2px;
  }
`;
