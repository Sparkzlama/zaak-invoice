import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFirebase } from './firebase.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built frontend in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

async function start() {
  // Initialize Firebase Admin
  initFirebase();
  console.log('Firebase initialized');

  app.use('/api/auth', authRoutes());
  app.use('/api/clients', clientRoutes());
  app.use('/api/invoices', invoiceRoutes());

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
