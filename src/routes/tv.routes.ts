import { Router } from 'express';
import {
  connectDevice, sendKeyEvent, openApp,
  inputText, mediaControl, powerControl, openUrl, takeScreenshot,
} from '../controllers/tv.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { deviceMiddleware } from '../middleware/device.middleware';

const router = Router();

// 1. Validar API Key en todas las rutas
router.use(authMiddleware);

// 2. Validar y extraer la IP del dispositivo Fire TV (header x-device-ip)
router.use(deviceMiddleware);

// Base Controls
router.post('/connect', connectDevice);
router.post('/keyevent/:code', sendKeyEvent);
router.post('/app/:package', openApp);

// Advanced Controls
router.post('/text', inputText);
router.post('/media/:control', mediaControl);
router.post('/power/:action', powerControl);
router.post('/url', openUrl);
router.get('/screenshot', takeScreenshot);

export default router;
