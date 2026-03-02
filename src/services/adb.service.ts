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

  /**
   * Ajusta el volumen del Fire TV usando 'service call audio'.
   * En Fire TV, `input keyevent 24/25` no surte efecto porque el volumen
   * se controla a nivel de servicio, no de input. Este método llama
   * directamente al servicio de Audio del sistema Android.
   *
   * @param deviceIp  - IP del Fire TV objetivo.
   * @param direction - 1 para subir, -1 para bajar.
   */
  async adjustVolume(deviceIp: string, direction: number): Promise<string> {
    // service call audio 3 = adjustStreamVolume
    // i32 3 = STREAM_MUSIC
    // i32 direction = 1 (subir) o -1 (bajar)
    // i32 1 = FLAG_SHOW_UI (muestra barra de volumen en TV)
    const command = `service call audio 3 i32 3 i32 ${direction} i32 1`;
    return this.executeCommand(deviceIp, command);
  }

  /**
   * Silencia/des-silencia el Fire TV usando 'input keyevent 164' (KEYCODE_MUTE).
   * Si no funciona, intenta vía 'service call audio' con setStreamMute.
   */
  async toggleMute(deviceIp: string): Promise<string> {
    // Intentar primero con media dispatch mute
    try {
      return await this.executeCommand(deviceIp, 'media dispatch mute');
    } catch {
      // Fallback a keyevent
      return this.executeCommand(deviceIp, 'input keyevent 164');
    }
  }
}

export const adbService = new AdbService();
