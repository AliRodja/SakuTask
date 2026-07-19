import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import api from '../lib/api';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ task_name: '', due_date: '', reminder_time: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    const { data } = await api.get('/todos');
    setTodos(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/todos', form);
      setForm({ task_name: '', due_date: '', reminder_time: '' });
      setShowForm(false);
      loadTodos();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah tugas.');
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tugas Harian</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 bg-blue-600 text-white text-sm rounded-lg px-3 py-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 mb-4 space-y-3 shadow-sm">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            placeholder="Nama tugas"
            value={form.task_name}
            onChange={(e) => setForm({ ...form, task_name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="time"
            value={form.reminder_time}
            onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">
            Simpan
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
          >
            <button
              onClick={() => toggleStatus(todo)}
              className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${
                todo.status === 'completed'
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300'
              }`}
            >
              {todo.status === 'completed' && <Check className="w-4 h-4" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {todo.task_name}
              </p>
              <p className="text-xs text-gray-400">
                {todo.due_date?.slice(0, 10)} · {todo.reminder_time?.slice(0, 5)}
              </p>
            </div>

            <button onClick={() => removeTodo(todo.id)} className="text-gray-300 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}

        {todos.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada tugas.</p>
        )}
      </ul>
    </div>
  );
}