export interface UpiParams {
  vpa: string;        // Virtual Payment Address (e.g., merchant@okhdfcbank)
  name: string;       // Merchant business name
  amount?: number;    // Optional pre-filled amount
  note?: string;      // Transaction note
}

export function generateUpiUrl(params: UpiParams): string {
  const query = new URLSearchParams({
    pa: params.vpa.trim(),
    pn: params.name.trim(),
    cu: 'INR',
  });

  if (params.amount && params.amount > 0) {
    query.append('am', params.amount.toFixed(2));
  }
  if (params.note) {
    query.append('tn', params.note.trim());
  }

  return `upi://pay?${query.toString()}`;
}

export function getWhatsAppReminderMessage(
  customerName: string,
  businessName: string,
  balance: number,
  upiUrl?: string,
  _language?: string
): string {
  const formattedBalance = Math.abs(balance).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  let message = `Dear ${customerName},\n\n`;
  message += `Your pending balance at ${businessName} is ₹${formattedBalance}.\n`;
  message += `Please make the payment at your earliest convenience.\n\n`;
  if (upiUrl) {
    message += `Click the link below to pay instantly via UPI:\n${upiUrl}\n\n`;
  }
  message += `Thank you,\n${businessName}`;

  return encodeURIComponent(message);
}
