export interface GstSlab {
  rate: number;
  label: string;
  cgst: number;
  sgst: number;
  igst: number;
  taxExempted: boolean;
}

export const GST_SLABS: GstSlab[] = [
  { rate: 0, label: 'Exempted (0%)', cgst: 0, sgst: 0, igst: 0, taxExempted: true },
  { rate: 0, label: '0% GST', cgst: 0, sgst: 0, igst: 0, taxExempted: false },
  { rate: 0.1, label: '0.1% GST', cgst: 0.05, sgst: 0.05, igst: 0.1, taxExempted: false },
  { rate: 0.25, label: '0.25% GST', cgst: 0.125, sgst: 0.125, igst: 0.25, taxExempted: false },
  { rate: 3, label: '3% GST (Gold/Jewellery)', cgst: 1.5, sgst: 1.5, igst: 3, taxExempted: false },
  { rate: 5, label: '5% GST', cgst: 2.5, sgst: 2.5, igst: 5, taxExempted: false },
  { rate: 6, label: '6% GST', cgst: 3, sgst: 3, igst: 6, taxExempted: false },
  { rate: 7.5, label: '7.5% GST', cgst: 3.75, sgst: 3.75, igst: 7.5, taxExempted: false },
  { rate: 12, label: '12% GST', cgst: 6, sgst: 6, igst: 12, taxExempted: false },
  { rate: 18, label: '18% GST (Standard)', cgst: 9, sgst: 9, igst: 18, taxExempted: false },
  { rate: 28, label: '28% GST (Luxury/Sin)', cgst: 14, sgst: 14, igst: 28, taxExempted: false },
];

