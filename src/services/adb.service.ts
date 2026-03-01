import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export class AdbService {
  private readonly ip: string;

  constructor() {
    this.ip = process.env.FIRE_TV_IP || '';
    if (!this.ip) {
      console.warn('WARNING: FIRE_TV_IP environment variable is not set.');
    }
  }

  /**
   * Connects to the Fire TV device via ADB over TCP/IP.
   */
  async connectDevice(): Promise<string> {
    if (!this.ip) throw new Error('FIRE_TV_IP is not configured');
    
    try {
      const { stdout, stderr } = await execPromise(`adb connect ${this.ip}:5555`, { timeout: 10000 });
      if (stderr && !stderr.includes('already connected') && !stderr.includes('daemon')) {
        throw new Error(`ADB Connect Error: ${stderr}`);
      }
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to connect to device: ${error.message}`);
    }
  }

  /**
   * Executes a shell command on the connected Fire TV device.
   * @param command The shell command to execute (e.g., 'input keyevent 3')
   */
  async executeCommand(command: string): Promise<string> {
    if (!this.ip) throw new Error('FIRE_TV_IP is not configured');

    try {
      const { stdout, stderr } = await execPromise(`adb -s ${this.ip}:5555 shell ${command}`, { timeout: 10000 });
      
      // Some ADB commands write non-fatal warnings to stderr. 
      // We'll throw only if the command truly failed or we get a severe error.
      if (stderr && stderr.toLowerCase().includes('error')) {
        throw new Error(`ADB Command Error: ${stderr.trim()}`);
      }
      
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to execute command [${command}]: ${error.message}`);
    }
  }
}

export const adbService = new AdbService();
