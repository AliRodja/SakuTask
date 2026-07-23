import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { formatDateOnly } from '../lib/format';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ task_name: '', due_date: '', reminder_time: '' });
  const [error, setError] = useState('');

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
      await api.post('/todos', form);
      setForm({ task_name: '', due_date: '', reminder_time: '' });
      setShowForm(false);
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

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-hi">Tugas Harian</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="gradient-btn text-sm px-3 py-1.5"
        >
          <Plus className="w-4 h-4" /> <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-4 mb-4 space-y-3">
          {error && (
            <div className="app-error" role="alert">
              <div className="app-error-dot" />
              <span>{error}</span>
            </div>
          )}
          <input
            placeholder="Nama tugas"
            value={form.task_name}
            onChange={(e) => setForm({ ...form, task_name: e.target.value })}
            className="app-input"
            required
          />
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="app-input"
            required
          />
          <input
            type="time"
            value={form.reminder_time}
            onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
            className="app-input"
            required
          />
          <button type="submit" disabled={submitting} className="gradient-btn w-full py-2.5 text-sm">
            <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </form>
      )}

      {loading ? (
        <Spinner label="Memuat tugas..." />
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="glass-card flex items-center gap-3 p-3">
              <button
                onClick={() => toggleStatus(todo)}
                className="w-6 h-6 shrink-0 rounded-full border flex items-center justify-center transition-colors"
                style={
                  todo.status === 'completed'
                    ? { background: 'var(--color-success)', borderColor: 'var(--color-success)', color: '#fff' }
                    : { borderColor: 'rgba(var(--ink-rgb),0.2)' }
                }
              >
                {todo.status === 'completed' && <Check className="w-4 h-4" />}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    todo.status === 'completed' ? 'line-through text-faint' : 'text-hi'
                  }`}
                >
                  {todo.task_name}
                </p>
                <p className="text-xs text-faint">
                  {todo.due_date && formatDateOnly(todo.due_date)} · {todo.reminder_time?.slice(0, 5)}
                </p>
              </div>

              <button onClick={() => removeTodo(todo.id)} className="text-faint hover:text-rose-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}

          {todos.length === 0 && (
            <p className="text-sm text-faint text-center py-8">Belum ada tugas.</p>
          )}
        </ul>
      )}
    </div>
  );
}
