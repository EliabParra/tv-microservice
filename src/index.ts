import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import tvRoutes from './routes/tv.routes';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/tv', tvRoutes);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'TV Microservice is running' });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
