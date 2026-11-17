export interface TradeUnit {
  id: string;
  name: string;
  symbol: string;
  secondaryUnitId?: string;
  conversionFactor?: number;
}

export const INVENTORY_UNITS: TradeUnit[] = [
  { id: 'PCS', name: 'Pieces', symbol: 'PCS' },
  { id: 'NOS', name: 'Numbers', symbol: 'NOS' },
  { id: 'KGS', name: 'Kilograms', symbol: 'KGS', secondaryUnitId: 'GMS', conversionFactor: 1000 },
  { id: 'GMS', name: 'Grams', symbol: 'GMS' },
  { id: 'LTR', name: 'Litres', symbol: 'LTR', secondaryUnitId: 'MLT', conversionFactor: 1000 },
  { id: 'MLT', name: 'Millilitres', symbol: 'MLT' },
  { id: 'MTR', name: 'Meters', symbol: 'MTR', secondaryUnitId: 'CMS', conversionFactor: 100 },
  { id: 'CMS', name: 'Centimeters', symbol: 'CMS' },
  { id: 'BOX', name: 'Boxes', symbol: 'BOX' },
  { id: 'BAG', name: 'Bags', symbol: 'BAG' },
  { id: 'BOR', name: 'Bora / Sacks', symbol: 'BOR' },
  { id: 'PET', name: 'Peti', symbol: 'PET' },
  { id: 'CTN', name: 'Cartons', symbol: 'CTN' },
  { id: 'DOZ', name: 'Dozens', symbol: 'DOZ' },
  { id: 'STRP', name: 'Strips (Pharma)', symbol: 'STRP' },
  { id: 'PAC', name: 'Packets', symbol: 'PAC' },
  { id: 'BUN', name: 'Bunches', symbol: 'BUN' },
  { id: 'BDL', name: 'Bundles', symbol: 'BDL' },
  { id: 'QTL', name: 'Quintal', symbol: 'QTL' },
  { id: 'TON', name: 'Tonnes', symbol: 'TON' },
  { id: 'SET', name: 'Sets', symbol: 'SET' },
  { id: 'PRS', name: 'Pairs', symbol: 'PRS' },
  { id: 'OTH', name: 'Other', symbol: 'OTH' },
];

