import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getFirestoreDb } from '../firebase.js';

const router = Router();

export default function() {

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const snapshot = await db.collection('clients')
      .where('userId', '==', req.userId)
      .get();
    const clients = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(clients);
  } catch (e) {
    console.error('GET /api/clients error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, email, mobile } = req.body;
    if (!name) return res.status(400).json({ error: 'Client name is required' });
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const docRef = await db.collection('clients').add({
      userId: req.userId,
      name,
      address: address || '',
      email: email || '',
      mobile: mobile || '',
      createdAt: new Date().toISOString()
    });
    const doc = await docRef.get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('POST /api/clients error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, email, mobile } = req.body;
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const doc = await db.collection('clients').doc(req.params.id).get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (email !== undefined) updates.email = email;
    if (mobile !== undefined) updates.mobile = mobile;
    await db.collection('clients').doc(req.params.id).update(updates);
    const updated = await db.collection('clients').doc(req.params.id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (e) {
    console.error('PUT /api/clients error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const doc = await db.collection('clients').doc(req.params.id).get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Client not found' });
    }
    await db.collection('clients').doc(req.params.id).delete();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('DELETE /api/clients error:', e.message, e.code);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

return router;
}
