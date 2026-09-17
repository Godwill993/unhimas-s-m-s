import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { lecturerRouter } from './routes/lecturer.js';
import { studentRouter } from './routes/student.js';
import { financeRouter } from './routes/finance.js';
import { publicRouter } from './routes/public.js';
import { announcementsRouter } from './routes/announcements.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    institution: 'UNHIMAS Bilingual University (Yaoundé, Cameroon)',
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/lecturer', lecturerRouter);
app.use('/api/student', studentRouter);
app.use('/api/finance', financeRouter);
app.use('/api/public', publicRouter);
app.use('/api/announcements', announcementsRouter);

// --- Global error handler ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🎓 UNHIMAS ERP Backend running on http://localhost:${PORT}`);
});

export default app;
