import * as Speech from 'expo-speech';

export class SoundboxService {
  /**
   * Announce payment receipt in clear voice
   */
  static announcePayment(amount: number, _language?: string) {
    const formattedAmount = amount.toLocaleString('en-IN');
    const text = `Payment of ${formattedAmount} rupees received on Khatabook`;

    Speech.speak(text, {
      language: 'en-IN',
      pitch: 1.0,
      rate: 0.95,
    });
  }

  /**
   * Announce transaction entry added
   */
  static announceEntry(
    type: 'GAVE' | 'GOT',
    amount: number,
    partyName: string,
    _language?: string
  ) {
    const formattedAmount = amount.toLocaleString('en-IN');
    const text =
      type === 'GAVE'
        ? `Gave ${formattedAmount} rupees to ${partyName}`
        : `Received ${formattedAmount} rupees from ${partyName}`;

    Speech.speak(text, {
      language: 'en-IN',
      pitch: 1.0,
      rate: 0.95,
    });
  }
}
