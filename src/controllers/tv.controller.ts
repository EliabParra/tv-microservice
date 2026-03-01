import { Request, Response } from 'express';
import { adbService } from '../services/adb.service';

export const connectDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adbService.connectDevice();
    res.status(200).json({ success: true, message: 'Device connected', data: result });
  } catch (error: any) {
    console.error('ADB Connect Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendKeyEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    if (!code || isNaN(Number(code))) {
      res.status(400).json({ success: false, error: 'Invalid keyevent code' });
      return;
    }

    const command = `input keyevent ${code}`;
    const result = await adbService.executeCommand(command);
    res.status(200).json({ success: true, message: `Keyevent ${code} sent`, data: result });
  } catch (error: any) {
    console.error('ADB KeyEvent Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const openApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { package: pkg } = req.params;
    
    if (!pkg) {
      res.status(400).json({ success: false, error: 'Package name is required' });
      return;
    }

    const command = `monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`;
    const result = await adbService.executeCommand(command);
    res.status(200).json({ success: true, message: `Opened app ${pkg}`, data: result });
  } catch (error: any) {
    console.error('ADB OpenApp Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
