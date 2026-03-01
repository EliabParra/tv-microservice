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

// ============================================================================
// FASE 7 - FUNCIONES AVANZADAS
// ============================================================================

export const inputText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'String "text" is required in body' });
      return;
    }

    // ADB requires spaces to be substituted with %s for input text command
    const sanitizedText = text.replace(/ /g, '%s');
    // Escape single quotes to prevent breaking the shell command
    const escapedText = sanitizedText.replace(/'/g, "\\'");

    const command = `input text '${escapedText}'`;
    const result = await adbService.executeCommand(command);
    res.status(200).json({ success: true, message: `Text sent`, data: result });
  } catch (error: any) {
    console.error('ADB InputText Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const mediaControl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { control } = req.params;
    
    // Mapeo fácil para el front-end a códigos keyevent nativos
    const mediaMap: Record<string, number> = {
      playpause: 85,
      next: 87,
      prev: 86,
      volup: 24,
      voldown: 25,
      mute: 164
    };

    const controlStr = String(control).toLowerCase();
    const code = mediaMap[controlStr];
    if (!code) {
      res.status(400).json({ success: false, error: `Invalid media control. Valid options: ${Object.keys(mediaMap).join(', ')}` });
      return;
    }

    const command = `input keyevent ${code}`;
    const result = await adbService.executeCommand(command);
    res.status(200).json({ success: true, message: `Media control [${control}] applied`, data: result });
  } catch (error: any) {
    console.error('ADB MediaControl Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const powerControl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.params;
    
    const powerMap: Record<string, number> = {
      sleep: 223,
      awake: 224,
      toggle: 26
    };

    const actionStr = String(action).toLowerCase();
    const code = powerMap[actionStr];
    if (!code) {
      res.status(400).json({ success: false, error: `Invalid power action. Valid options: ${Object.keys(powerMap).join(', ')}` });
      return;
    }

    const command = `input keyevent ${code}`;
    const result = await adbService.executeCommand(command);
    res.status(200).json({ success: true, message: `Power action [${action}] sent`, data: result });
  } catch (error: any) {
    console.error('ADB PowerControl Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const openUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'String "url" is required in body' });
      return;
    }

    const command = `am start -a android.intent.action.VIEW -d "${url}"`;
    const result = await adbService.executeCommand(command);
    res.status(200).json({ success: true, message: `URL opened in browser`, data: result });
  } catch (error: any) {
    console.error('ADB OpenUrl Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const invokeAlexa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'String "query" is required in body' });
      return;
    }

    // This intent explicitly launches Android TV's global voice search / Alexa with pre-filled text
    const command = `am start -a android.intent.action.SEARCH -e query "${query}"`;
    await adbService.executeCommand(command);
    
    // Simulate pressing "ENTER" to execute the search automatically
    await adbService.executeCommand(`input keyevent 66`);

    res.status(200).json({ success: true, message: `Alexa query dispatched: ${query}` });
  } catch (error: any) {
    console.error('ADB Alexa Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Screenshot uses a different signature because we pipe the buffer directly to Express response
export const takeScreenshot = async (req: Request, res: Response): Promise<void> => {
  try {
    // We cannot use adbService.executeCommand because it returns a string (utf-8)
    // Screencap is raw binary PNG data. We must construct a native shell command.
    const ip = process.env.FIRE_TV_IP || '';
    if (!ip) throw new Error('FIRE_TV_IP is not configured');

    const { exec } = require('child_process');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');

    // Exec-out gets stdout binary as stream without shell terminal emulation corruption
    const child = exec(`adb -s ${ip}:5555 exec-out screencap -p`);
    
    child.stdout.pipe(res);
    child.stderr.on('data', (data: string) => {
        console.error('ADB Screencap Error Stream:', data);
    });
    
    child.on('exit', (code: number) => {
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
