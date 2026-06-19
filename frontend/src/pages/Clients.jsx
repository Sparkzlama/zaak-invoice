import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', email: '', mobile: '' });
  const [error, setError] = useState('');

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      const { data } = await axios.get('/api/clients');
      setClients(data);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleApiError = (err) => {
    const detail = err.response?.data?.code ? ` (${err.response.data.code})` : '';
    const msg = err.response?.data?.error
      ? `${err.response.data.error}${detail}`
      : err.message || 'Server not reachable. Is the backend running?';
    setError(msg);
    setTimeout(() => setError(''), 8000);
  };

  const resetForm = () => {
    setForm({ name: '', address: '', email: '', mobile: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setError('');
    try {
      if (editing) {
        await axios.put(`/api/clients/${editing}`, form);
      } else {
        await axios.post('/api/clients', form);
      }
      resetForm();
      loadClients();
    } catch (err) {
      handleApiError(err);
    }
  };

  const editClient = (client) => {
    setForm({ name: client.name, address: client.address || '', email: client.email || '', mobile: client.mobile || '' });
    setEditing(client.id);
    setShowForm(true);
  };

  const deleteClient = async (id) => {
    if (!confirm('Delete this client?')) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      loadClients();
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ Add Client</button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {showForm && (
        <div className="card mb-8 border-brand-100 bg-brand-50/50">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Client' : 'Add New Client'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input type="tel" className="input-field" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea className="input-field" rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Client</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">&#128101;</p>
            <p>No clients yet. Add your first client!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Mobile</th>
                  <th className="pb-3 font-medium">Address</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-gray-500">{c.email || '-'}</td>
                    <td className="py-3 text-gray-500">{c.mobile || '-'}</td>
                    <td className="py-3 text-gray-500 max-w-xs truncate">{c.address || '-'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => editClient(c)} className="text-brand-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => deleteClient(c.id)} className="text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
