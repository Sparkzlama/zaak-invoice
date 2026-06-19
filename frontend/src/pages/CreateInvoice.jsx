import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DEFAULT_TERMS = `1. All disputes subject to Kolkata jurisdiction.
2. Payment due within 30 days of invoice date.
3. Interest @ 18% p.a. will be charged on overdue payments.
4. This is a computer-generated invoice.`;

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [sgst, setSgst] = useState(9);
  const [cgst, setCgst] = useState(9);
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/clients').then(({ data }) => setClients(data)).catch(() => {});
  }, []);

  const selectClient = (id) => {
    setClientId(id);
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientName(client.name || '');
      setClientAddress(client.address || '');
      setClientEmail(client.email || '');
      setClientMobile(client.mobile || '');
    }
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, price: 0 }]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const updateItem = (i, field, value) => {
    const newItems = [...items];
    newItems[i][field] = field === 'description' ? value : parseFloat(value) || 0;
    setItems(newItems);
  };

  const subtotal = items.reduce((s, item) => s + (item.quantity * item.price), 0);
  const sgstAmt = subtotal * sgst / 100;
  const cgstAmt = subtotal * cgst / 100;
  const total = subtotal + sgstAmt + cgstAmt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert('Please select a client');
    if (!items.some(i => i.description && i.quantity > 0 && i.price > 0)) return alert('Please add at least one valid item');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/invoices', {
        client_id: clientId,
        client_name: clientName,
        client_address: clientAddress,
        client_email: clientEmail,
        client_mobile: clientMobile,
        invoice_no: invoiceNo || undefined,
        date,
        due_date: dueDate || undefined,
        sgst_percent: sgst,
        cgst_percent: cgst,
        items: items.filter(i => i.description),
        terms
      });
      navigate(`/invoice/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Invoice</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-brand-700">Client Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                <select className="input-field" value={clientId} onChange={e => selectClient(e.target.value)} required>
                  <option value="">-- Select Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-brand-700">Invoice Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No (auto if blank)</label>
                <input type="text" className="input-field" placeholder="e.g. INV-001" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
              </div>
              <div className="text-sm text-gray-600 space-y-1 pt-2 border-t border-gray-200">
                <p className="font-semibold text-gray-800">ZAAK CONSTRUCTION</p>
                <p>15/H, Miajan Ostagar Lane, Kolkata - 700017</p>
                <p>zaakconstructionindia@gmail.com</p>
                <p>+91 - 9123749064</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-brand-700">Services / Items</h2>
            <button type="button" onClick={addItem} className="btn-secondary text-sm py-1.5 px-3">+ Add Row</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 w-2/5 font-medium">Description</th>
                  <th className="pb-2 w-1/6 font-medium">Quantity</th>
                  <th className="pb-2 w-1/6 font-medium">Price (&#8377;)</th>
                  <th className="pb-2 w-1/6 font-medium text-right">Amount (&#8377;)</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <input type="text" className="input-field text-sm py-1.5" placeholder="Description"
                        value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" className="input-field text-sm py-1.5" step="0.01" min="0"
                        value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" className="input-field text-sm py-1.5" step="0.01" min="0"
                        value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} required />
                    </td>
                    <td className="py-2 text-right font-medium">
                      &#8377;{(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="py-2 text-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">&times;</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-brand-700">Tax Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SGST (%)</label>
                  <input type="number" className="input-field text-sm py-1.5" step="0.1" min="0"
                    value={sgst} onChange={e => setSgst(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CGST (%)</label>
                  <input type="number" className="input-field text-sm py-1.5" step="0.1" min="0"
                    value={cgst} onChange={e => setCgst(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-brand-700">Total Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">&#8377;{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">SGST ({sgst}%)</span>
                <span className="font-medium">&#8377;{sgstAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">CGST ({cgst}%)</span>
                <span className="font-medium">&#8377;{cgstAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 text-lg font-bold text-brand-700">
                <span>Total</span>
                <span>&#8377;{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 text-brand-700">Terms & Conditions</h2>
          <textarea className="input-field" rows="4" value={terms} onChange={e => setTerms(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary px-8" disabled={loading}>
            {loading ? 'Creating...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
