import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  securityLevel: LocalAuthentication.SecurityLevel;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  canAuthenticate: boolean;
  typeDescription: string;
  errorMessage?: string;
}

export class AppLockService {
  /**
   * Deep check of biometric hardware & enrolled credentials
   */
  static async getStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Device can authenticate if biometrics are enrolled OR if device credentials (PIN/Pattern/Passcode) are enrolled
      const canAuthenticate = (hasHardware && isEnrolled) || securityLevel !== LocalAuthentication.SecurityLevel.NONE;

      let typeDescription = 'Biometrics / PIN';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        typeDescription = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        typeDescription = 'Fingerprint';
      } else if (securityLevel === LocalAuthentication.SecurityLevel.SECRET) {
        typeDescription = 'Device PIN / Pattern';
      }

      let errorMessage: string | undefined;
      if (!hasHardware && securityLevel === LocalAuthentication.SecurityLevel.NONE) {
        errorMessage = 'Your device does not support biometric or secure lock screen.';
      } else if (!isEnrolled && securityLevel === LocalAuthentication.SecurityLevel.NONE) {
        errorMessage = 'No biometric or screen lock found. Please set up fingerprint, face, or PIN in your phone Settings.';
      }

      return {
        hasHardware,
        isEnrolled,
        securityLevel,
        supportedTypes,
        canAuthenticate,
        typeDescription,
        errorMessage,
      };
    } catch (e: any) {
      console.warn('AppLockService.getStatus error:', e);
      return {
        hasHardware: false,
        isEnrolled: false,
        securityLevel: LocalAuthentication.SecurityLevel.NONE,
        supportedTypes: [],
        canAuthenticate: false,
        typeDescription: 'Screen Lock',
        errorMessage: e?.message || 'Failed to detect biometric status',
      };
    }
  }

  /**
   * Check if device is capable of biometric or device PIN authentication
   */
  static async isAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return status.canAuthenticate;
  }

  /**
   * Prompt user for Face ID, Fingerprint, or device PIN/Pattern
   */
  static async authenticate(prompt = 'Unlock Khatabook'): Promise<{ success: boolean; error?: string }> {
    try {
      const status = await this.getStatus();
      if (!status.canAuthenticate) {
        return {
          success: false,
          error: status.errorMessage || 'No biometric or device screen lock enrolled on this device.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication canceled',
      };
    } catch (e: any) {
      console.error('AppLockService.authenticate error:', e);
      return {
        success: false,
        error: e?.message || 'Authentication error',
      };
    }
  }
}
