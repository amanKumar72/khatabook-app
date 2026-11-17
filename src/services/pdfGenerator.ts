import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Bill, BillItem, Customer, Transaction } from '../types/models';

export class PdfGenerator {
  /**
   * Helper to build clean HTML for Invoice
   */
  static buildInvoiceHtml(
    bill: Bill,
    items: BillItem[],
    business: { name: string; phone?: string; address?: string; gstin?: string }
  ): string {
    const itemsRows = items
      .map(
        (it, idx) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 500;">${it.item_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${it.quantity} ${it.unit}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${it.rate.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${it.tax_percentage}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600;">₹${it.amount.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #222; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px; }
            .biz-title { font-size: 22px; font-weight: bold; color: #16a34a; }
            .biz-sub { font-size: 13px; color: #555; margin-top: 4px; }
            .doc-type { font-size: 22px; font-weight: bold; color: #333; text-transform: uppercase; }
            .meta-box { margin-bottom: 24px; display: flex; justify-content: space-between; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background-color: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
            .totals-container { margin-top: 24px; display: flex; justify-content: flex-end; }
            .totals-table { width: 280px; font-size: 14px; }
            .totals-table td { padding: 6px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: #16a34a; border-top: 2px solid #16a34a; padding-top: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="biz-title">${business.name}</div>
              ${business.phone ? `<div class="biz-sub">Phone: ${business.phone}</div>` : ''}
              ${business.address ? `<div class="biz-sub">Address: ${business.address}</div>` : ''}
              ${business.gstin ? `<div class="biz-sub"><strong>GSTIN:</strong> ${business.gstin}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div class="doc-type">${bill.bill_type.replace('_', ' ')}</div>
              <div class="biz-sub">Bill No: <strong>#${bill.bill_number}</strong></div>
              <div class="biz-sub">Date: ${bill.bill_date}</div>
            </div>
          </div>

          ${
            bill.customer_name
              ? `<div class="meta-box">
                  <div>Bill To: <strong>${bill.customer_name}</strong></div>
                  <div>Payment Mode: <strong>${bill.payment_mode}</strong></div>
                </div>`
              : ''
          }

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">#</th>
                <th>Item Description</th>
                <th style="text-align: center; width: 90px;">Qty</th>
                <th style="text-align: right; width: 90px;">Rate</th>
                <th style="text-align: center; width: 70px;">GST</th>
                <th style="text-align: right; width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${bill.subtotal.toFixed(2)}</td>
              </tr>
              ${
                bill.tax_total > 0
                  ? `<tr>
                      <td>Total GST:</td>
                      <td style="text-align: right;">₹${bill.tax_total.toFixed(2)}</td>
                    </tr>`
                  : ''
              }
              ${
                bill.discount > 0
                  ? `<tr>
                      <td>Discount:</td>
                      <td style="text-align: right; color: #dc2626;">- ₹${bill.discount.toFixed(2)}</td>
                    </tr>`
                  : ''
              }
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td style="text-align: right;">₹${bill.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            Thank you for your business! Generated via Khatabook Offline
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate and share a clean GST / Non-GST Invoice PDF
   */
  static async generateInvoice(
    bill: Bill,
    items: BillItem[],
    business: { name: string; phone?: string; address?: string; gstin?: string }
  ): Promise<void> {
    const html = this.buildInvoiceHtml(bill, items, business);
    const { uri } = await Print.printToFileAsync({ html });
    
    // Copy to app's cache directory with clean filename for Android FilePermissionService compatibility
    const cleanNumber = (bill.bill_number || `invoice_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetUri = `${FileSystem.cacheDirectory}Invoice_${cleanNumber}.pdf`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: targetUri,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(targetUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Invoice #${bill.bill_number}`,
      });
    }
  }

  /**
   * Print Invoice directly using system print dialog
   */
  static async printInvoice(
    bill: Bill,
    items: BillItem[],
    business: { name: string; phone?: string; address?: string; gstin?: string }
  ): Promise<void> {
    const html = this.buildInvoiceHtml(bill, items, business);
    await Print.printAsync({ html });
  }

  /**
   * Generate and share a clean Customer / Supplier Ledger Statement
   */
  static async generateLedgerStatement(
    customer: Customer,
    transactions: Transaction[],
    business: { name: string; phone?: string }
  ): Promise<void> {
    let runningBalance = 0;
    const rows = transactions
      .map((t) => {
        // Customer perspective: Gave = You gave (debit +), Got = You got (credit -)
        const isGave = t.type === 1;
        const gaveAmt = isGave ? t.amount : 0;
        const gotAmt = !isGave ? t.amount : 0;

        if (customer.party_type === 1) {
          // Customer: Gave increases debit balance, Got decreases
          runningBalance += isGave ? t.amount : -t.amount;
        } else {
          // Supplier: Got (we got goods) increases payable, Gave decreases
          runningBalance += !isGave ? t.amount : -t.amount;
        }

        return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${t.date}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${t.description || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #dc2626; font-weight: 500;">
            ${gaveAmt > 0 ? `₹${gaveAmt.toFixed(2)}` : '-'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #16a34a; font-weight: 500;">
            ${gotAmt > 0 ? `₹${gotAmt.toFixed(2)}` : '-'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">
            ₹${runningBalance.toFixed(2)}
          </td>
        </tr>`;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #222; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            .biz-title { font-size: 22px; font-weight: bold; color: #2563eb; }
            .party-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f1f5f9; padding: 10px 8px; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
            .net-balance { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="biz-title">${business.name}</div>
              ${business.phone ? `<div>Phone: ${business.phone}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: bold;">LEDGER STATEMENT</div>
              <div style="font-size: 13px; color: #64748b;">${new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div class="party-box">
            <div>
              <div style="font-size: 16px; font-weight: bold;">${customer.name}</div>
              <div>Phone: ${customer.phone || 'N/A'}</div>
              <div>Type: ${customer.party_type === 1 ? 'Customer' : 'Supplier'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #64748b;">Net Balance</div>
              <div style="font-size: 20px; font-weight: bold; color: ${customer.balance >= 0 ? '#16a34a' : '#dc2626'};">
                ₹${Math.abs(customer.balance).toFixed(2)} ${customer.balance >= 0 ? '(Receivable)' : '(Payable)'}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 100px;">Date</th>
                <th>Details</th>
                <th style="text-align: right; width: 110px;">You Gave (₹)</th>
                <th style="text-align: right; width: 110px;">You Got (₹)</th>
                <th style="text-align: right; width: 120px;">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="net-balance">
            Final Balance: ₹${customer.balance.toFixed(2)}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    // Copy to app's cache directory with clean filename for Android FilePermissionService compatibility
    const cleanName = (customer.name || 'statement').replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetUri = `${FileSystem.cacheDirectory}Ledger_${cleanName}_${Date.now()}.pdf`;

    await FileSystem.copyAsync({
      from: uri,
      to: targetUri,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(targetUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${customer.name} Ledger Statement`,
      });
    }
  }
}
