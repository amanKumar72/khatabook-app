import * as LocalAuthentication from 'expo-local-authentication';

export class AppLockService {
  /**
   * Check if device has biometrics or screen lock enrolled
   */
  static async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  /**
   * Prompt user for Face ID, Fingerprint, or device PIN
   */
  static async authenticate(prompt = 'Unlock Khatabook'): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) {
      return true; // If device has no screen lock or biometrics, allow access
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: 'Use Device PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }
}

