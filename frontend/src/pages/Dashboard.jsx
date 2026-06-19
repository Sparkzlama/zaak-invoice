import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, clients: 0, revenue: 0 });

  useEffect(() => {
    axios.get('/api/invoices').then(({ data }) => {
      setInvoices(data);
      setStats({
        total: data.length,
        clients: new Set(data.map(i => i.clientId)).size,
        revenue: data.reduce((sum, i) => sum + i.total, 0)
      });
    }).catch(() => {});
  }, []);

  const deleteInvoice = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await axios.delete(`/api/invoices/${id}`);
    setInvoices(invoices.filter(i => i.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <Link to="/create-invoice" className="btn-primary">+ New Invoice</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-500 text-sm">Total Invoices</p>
          <p className="text-3xl font-bold text-brand-700">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Total Clients</p>
          <p className="text-3xl font-bold text-brand-700">{stats.clients}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-brand-700">&#8377;{stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">&#128196;</p>
            <p>No invoices yet. Create your first invoice!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Invoice No</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map(inv => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium text-brand-700">{inv.invoiceNo}</td>
                    <td className="py-3">{inv.clientName}</td>
                    <td className="py-3">{inv.date}</td>
                    <td className="py-3 text-right">&#8377;{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right">
                      <Link to={`/invoice/${inv.id}`} className="text-brand-600 hover:underline mr-3">View</Link>
                      <button onClick={() => deleteInvoice(inv.id)} className="text-red-500 hover:underline">Delete</button>
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
