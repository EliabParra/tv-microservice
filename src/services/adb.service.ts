import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export class AdbService {
  /**
   * Conecta al dispositivo Fire TV via ADB sobre TCP/IP.
   * @param deviceIp - IP del Fire TV objetivo (viene del header x-device-ip).
   */
  async connectDevice(deviceIp: string): Promise<string> {
    try {
      const { stdout, stderr } = await execPromise(`adb connect ${deviceIp}:5555`, { timeout: 10000 });
      if (stderr && !stderr.includes('already connected') && !stderr.includes('daemon')) {
        throw new Error(`ADB Connect Error: ${stderr}`);
      }
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to connect to device [${deviceIp}]: ${error.message}`);
    }
  }

  /**
   * Ejecuta un comando ADB shell en el dispositivo indicado.
   * @param deviceIp - IP del Fire TV objetivo.
   * @param command  - Comando shell a ejecutar (ej. 'input keyevent 3').
   */
  async executeCommand(deviceIp: string, command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execPromise(
        `adb -s ${deviceIp}:5555 shell ${command}`,
        { timeout: 10000 }
      );

      if (stderr && stderr.toLowerCase().includes('error')) {
        throw new Error(`ADB Command Error: ${stderr.trim()}`);
      }

      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to execute command [${command}] on [${deviceIp}]: ${error.message}`);
    }
  }
}

export const adbService = new AdbService();
