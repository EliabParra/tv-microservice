import { Request, Response } from 'express';
import { adbService } from '../services/adb.service';

export const connectDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceIp: string = res.locals.deviceIp;
    const result = await adbService.connectDevice(deviceIp);
    res.status(200).json({ success: true, message: 'Device connected', data: result });
  } catch (error: any) {
    console.error('ADB Connect Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendKeyEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const deviceIp: string = res.locals.deviceIp;

    if (!code || isNaN(Number(code))) {
      res.status(400).json({ success: false, error: 'Invalid keyevent code' });
      return;
    }

    const command = `input keyevent ${code}`;
    const result = await adbService.executeCommand(deviceIp, command);
    res.status(200).json({ success: true, message: `Keyevent ${code} sent`, data: result });
  } catch (error: any) {
    console.error('ADB KeyEvent Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const openApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { package: pkg } = req.params;
    const deviceIp: string = res.locals.deviceIp;

    if (!pkg) {
      res.status(400).json({ success: false, error: 'Package name is required' });
      return;
    }

    const command = `monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`;
    const result = await adbService.executeCommand(deviceIp, command);
    res.status(200).json({ success: true, message: `Opened app ${pkg}`, data: result });
  } catch (error: any) {
    console.error('ADB OpenApp Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// FASE 7 - FUNCIONES AVANZADAS
// ============================================================================

export const inputText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const deviceIp: string = res.locals.deviceIp;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'String "text" is required in body' });
      return;
    }

    const sanitizedText = text.replace(/ /g, '%s');
    const escapedText = sanitizedText.replace(/'/g, "\\'");

    const command = `input text '${escapedText}'`;
    const result = await adbService.executeCommand(deviceIp, command);
    res.status(200).json({ success: true, message: `Text sent`, data: result });
  } catch (error: any) {
    console.error('ADB InputText Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const mediaControl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { control } = req.params;
    const deviceIp: string = res.locals.deviceIp;

    const mediaMap: Record<string, number> = {
      playpause: 85,
      next: 87,
      prev: 86,
      volup: 24,
      voldown: 25,
      mute: 164,
    };

    const controlStr = String(control).toLowerCase();
    const code = mediaMap[controlStr];
    if (!code) {
      res.status(400).json({
        success: false,
        error: `Invalid media control. Valid options: ${Object.keys(mediaMap).join(', ')}`,
      });
      return;
    }

    const command = `input keyevent ${code}`;
    const result = await adbService.executeCommand(deviceIp, command);
    res.status(200).json({ success: true, message: `Media control [${control}] applied`, data: result });
  } catch (error: any) {
    console.error('ADB MediaControl Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const powerControl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.params;
    const deviceIp: string = res.locals.deviceIp;

    const powerMap: Record<string, number> = {
      sleep: 223,
      awake: 224,
      toggle: 26,
    };

    const actionStr = String(action).toLowerCase();
    const code = powerMap[actionStr];
    if (!code) {
      res.status(400).json({
        success: false,
        error: `Invalid power action. Valid options: ${Object.keys(powerMap).join(', ')}`,
      });
      return;
    }

    const command = `input keyevent ${code}`;
    const result = await adbService.executeCommand(deviceIp, command);
    res.status(200).json({ success: true, message: `Power action [${action}] sent`, data: result });
  } catch (error: any) {
    console.error('ADB PowerControl Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const openUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    const deviceIp: string = res.locals.deviceIp;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'String "url" is required in body' });
      return;
    }

    const command = `am start -a android.intent.action.VIEW -d "${url}"`;
    const result = await adbService.executeCommand(deviceIp, command);
    res.status(200).json({ success: true, message: `URL opened in browser`, data: result });
  } catch (error: any) {
    console.error('ADB OpenUrl Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const takeScreenshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceIp: string = res.locals.deviceIp;

    const { spawn } = require('child_process');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');

    const child = spawn('adb', ['-s', `${deviceIp}:5555`, 'exec-out', 'screencap', '-p']);

    child.stdout.pipe(res);

    child.stderr.on('data', (data: Buffer) => {
      console.error('ADB Screencap Error Stream:', data.toString());
    });

    child.on('close', (code: number) => {
      if (code !== 0) {
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to capture screen' });
        }
      }
    });
  } catch (error: any) {
    console.error('ADB Screencap Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

export const volumeControl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.params;
    const deviceIp: string = res.locals.deviceIp;

    const directionMap: Record<string, number> = {
      up: 1,
      down: -1,
    };

    const direction = directionMap[String(action).toLowerCase()];
    if (direction === undefined) {
      res.status(400).json({
        success: false,
        error: `Invalid volume action. Valid options: up, down`,
      });
      return;
    }

    const result = await adbService.adjustVolume(deviceIp, direction);
    res.status(200).json({ success: true, message: `Volume ${action}`, data: result });
  } catch (error: any) {
    console.error('ADB Volume Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const muteControl = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceIp: string = res.locals.deviceIp;
    const result = await adbService.toggleMute(deviceIp);
    res.status(200).json({ success: true, message: 'Mute toggled', data: result });
  } catch (error: any) {
    console.error('ADB Mute Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
