import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getFirestoreDb } from '../firebase.js';

const router = Router();

function numberToWords(n) {
  if (n === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const units = (v) => { if (v < 20) return a[v]; const t = Math.floor(v / 10); const o = v % 10; return b[t] + (o ? ' ' + a[o] : ''); };
  const convert = (v) => {
    if (v === 0) return '';
    if (v < 100) return units(v);
    if (v < 1000) return a[Math.floor(v / 100)] + ' Hundred' + (v % 100 ? ' ' + convert(v % 100) : '');
    if (v < 100000) return convert(Math.floor(v / 1000)) + ' Thousand' + (v % 1000 ? ' ' + convert(v % 1000) : '');
    if (v < 10000000) return convert(Math.floor(v / 100000)) + ' Lakh' + (v % 100000 ? ' ' + convert(v % 100000) : '');
    return convert(Math.floor(v / 10000000)) + ' Crore' + (v % 10000000 ? ' ' + convert(v % 10000000) : '');
  };
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100);
  let result = convert(whole) + ' Rupees';
  if (frac > 0) result += ' And ' + convert(frac) + ' Paise';
  return result + ' Only';
}

async function getNextInvoiceNo(db, userId) {
  const counterRef = db.collection('counters').doc(`invoices_${userId}`);
  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    let nextNum = 1;
    if (doc.exists) {
      nextNum = doc.data().current + 1;
    }
    transaction.set(counterRef, { current: nextNum }, { merge: true });
    return 'INV-' + String(nextNum).padStart(4, '0');
  });
  return result;
}

export default function() {

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const snapshot = await db.collection('invoices')
      .where('userId', '==', req.userId)
      .get();
    const invoices = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(invoices);
  } catch (e) {
    console.error('GET /api/invoices error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const doc = await db.collection('invoices').doc(req.params.id).get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('GET /api/invoices/:id error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, client_name, client_address, client_email, client_mobile, invoice_no, date, due_date, sgst_percent, cgst_percent, items, terms } = req.body;
    if (!client_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Client and items are required' });
    }

    let subtotal = 0;
    for (const item of items) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      subtotal += qty * price;
    }
    const sgstP = parseFloat(sgst_percent) || 0;
    const cgstP = parseFloat(cgst_percent) || 0;
    const sgstAmt = subtotal * sgstP / 100;
    const cgstAmt = subtotal * cgstP / 100;
    const total = subtotal + sgstAmt + cgstAmt;
    const totalWords = numberToWords(total);

    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const invoiceNo = invoice_no || await getNextInvoiceNo(db, req.userId);
    const invoiceItems = items.filter(i => i.description).map(i => ({
      description: i.description,
      quantity: parseFloat(i.quantity) || 0,
      price: parseFloat(i.price) || 0,
      amount: (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0)
    }));

    const docRef = await db.collection('invoices').add({
      userId: req.userId,
      clientId: client_id,
      clientName: client_name || '',
      clientAddress: client_address || '',
      clientEmail: client_email || '',
      clientMobile: client_mobile || '',
      invoiceNo,
      date: date || new Date().toISOString().split('T')[0],
      dueDate: due_date || '',
      subtotal,
      sgstPercent: sgstP,
      cgstPercent: cgstP,
      sgstAmount: sgstAmt,
      cgstAmount: cgstAmt,
      total,
      totalInWords: totalWords,
      terms: terms || '1. All disputes subject to Kolkata jurisdiction.\n2. Payment due within 30 days of invoice date.\n3. Interest @ 18% p.a. will be charged on overdue payments.\n4. This is a computer-generated invoice.',
      items: invoiceItems,
      createdAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('POST /api/invoices error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const doc = await db.collection('invoices').doc(req.params.id).get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    await db.collection('invoices').doc(req.params.id).delete();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('DELETE /api/invoices error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

return router;
}
