import { Router } from 'express';
import { 
  connectDevice, sendKeyEvent, openApp,
  inputText, mediaControl, powerControl, openUrl, takeScreenshot 
} from '../controllers/tv.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protect ALL routes in this router with API Key auth
router.use(authMiddleware);

// Base Controls (Fase 4)
router.post('/connect', connectDevice);
router.post('/keyevent/:code', sendKeyEvent);
router.post('/app/:package', openApp);

// Advanced Controls (Fase 7)
router.post('/text', inputText);
router.post('/media/:control', mediaControl);
router.post('/power/:action', powerControl);
router.post('/url', openUrl);
router.get('/screenshot', takeScreenshot);

export default router;
