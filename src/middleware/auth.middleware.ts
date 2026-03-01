import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    console.error('CRITICAL: API_KEY is not set in environment variables');
    res.status(500).json({ success: false, error: 'Internal Server Error: API_KEY is missing' });
    return;
  }

  // Check both popular header names for API keys
  let receivedApiKey = req.header('x-api-key') || req.header('Authorization');

  // Strip 'Bearer ' if they passed it as an Authorization token
  if (receivedApiKey && receivedApiKey.startsWith('Bearer ')) {
    receivedApiKey = receivedApiKey.replace('Bearer ', '');
  }

  if (!receivedApiKey || receivedApiKey !== expectedApiKey) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
    return;
  }

  next();
};
