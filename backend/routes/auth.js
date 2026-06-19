import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getFirestoreDb } from '../firebase.js';

const router = Router();

export default function() {

router.get('/me', auth, async (req, res) => {
  const db = getFirestoreDb();
  const doc = await db.collection('users').doc(req.userId).get();
  if (!doc.exists) {
    return res.json({ id: req.userId, email: req.userEmail, name: '', mobile: '' });
  }
  res.json({ id: req.userId, ...doc.data() });
});

router.put('/profile', auth, async (req, res) => {
  const { name, mobile } = req.body;
  const db = getFirestoreDb();
  await db.collection('users').doc(req.userId).set({
    name: name || '',
    mobile: mobile || '',
    email: req.userEmail,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  res.json({ message: 'Profile updated' });
});

return router;
}
