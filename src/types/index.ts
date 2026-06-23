export type Barcode = string & { readonly __brand: 'Barcode' };

export type MovementDate = string & { readonly __brand: 'MovementDate' };

export type IsoDateTimeString = string & { readonly __brand: 'IsoDateTimeString' };

export interface Product {
  id: number;
  barcode: Barcode;
  name: string | null;
  created_at: IsoDateTimeString;
}

export interface StockMovement {
  id: number;
  barcode: Barcode;
  quantity: number;
  movement_date: MovementDate;
  note: string | null;
  created_at: IsoDateTimeString;
}

export interface RegisterStockMovementInput {
  barcode: string;
  quantity: number;
  movementDate: string;
  note?: string;
}
