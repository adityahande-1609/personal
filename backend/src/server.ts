import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import propertiesRouter from './routes/properties.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'rental-platform-api' }));
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.name === 'ZodError') return res.status(400).json({ error: 'Invalid request parameters' });
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(Number(process.env.PORT || 4000), () => console.log('API listening on http://localhost:4000'));
