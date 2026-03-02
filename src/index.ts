import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import tvRoutes from './routes/tv.routes';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-device-ip', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/tv', tvRoutes);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'TV Microservice is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
});
