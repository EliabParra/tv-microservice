import { Router } from 'express';
import { connectDevice, sendKeyEvent, openApp } from '../controllers/tv.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protect ALL routes in this router with API Key auth
router.use(authMiddleware);

router.post('/connect', connectDevice);
router.post('/keyevent/:code', sendKeyEvent);
router.post('/app/:package', openApp);

export default router;
