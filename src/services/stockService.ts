import { initDb } from '../database/initDb';
import type { Barcode, IsoDateTimeString, MovementDate, StockMovement } from '../types';

const MIN_BARCODE_LENGTH = 6;
const MOVEMENT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface StockSummary {
  movementCount: number;
  productCount: number;
  todayQuantity: number;
  totalQuantity: number;
}

export async function registerStockMovement(
  barcode: string,
  quantity: number,
  movementDate: string,
  note?: string
): Promise<StockMovement> {
  const normalizedBarcode = normalizeBarcode(barcode);
  const normalizedQuantity = normalizeQuantity(quantity);
  const normalizedMovementDate = normalizeMovementDate(movementDate);
  const normalizedNote = normalizeNote(note);
  const createdAt = new Date().toISOString() as IsoDateTimeString;

  const db = await initDb();
  let movementId: number | null = null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `
        INSERT OR IGNORE INTO products (barcode, name, created_at)
        VALUES (?, NULL, ?);
      `,
      [normalizedBarcode, createdAt]
    );

    const result = await db.runAsync(
      `
        INSERT INTO stock_movements (
          barcode,
          quantity,
          movement_date,
          note,
          created_at
        )
        VALUES (?, ?, ?, ?, ?);
      `,
      [
        normalizedBarcode,
        normalizedQuantity,
        normalizedMovementDate,
        normalizedNote,
        createdAt,
      ]
    );

    movementId = result.lastInsertRowId;
  });

  if (movementId === null) {
    throw new Error('Nao foi possivel registrar a movimentacao de estoque.');
  }

  return {
    id: movementId,
    barcode: normalizedBarcode,
    quantity: normalizedQuantity,
    movement_date: normalizedMovementDate,
    note: normalizedNote,
    created_at: createdAt,
  };
}

export async function getStockSummary(): Promise<StockSummary> {
  const db = await initDb();
  const today = getTodayMovementDate();

  const productCount = await db.getFirstAsync<{ value: number }>(
    'SELECT COUNT(*) AS value FROM products;'
  );
  const movementCount = await db.getFirstAsync<{ value: number }>(
    'SELECT COUNT(*) AS value FROM stock_movements;'
  );
  const totalQuantity = await db.getFirstAsync<{ value: number | null }>(
    'SELECT COALESCE(SUM(quantity), 0) AS value FROM stock_movements;'
  );
  const todayQuantity = await db.getFirstAsync<{ value: number | null }>(
    'SELECT COALESCE(SUM(quantity), 0) AS value FROM stock_movements WHERE movement_date = ?;',
    [today]
  );

  return {
    movementCount: Number(movementCount?.value ?? 0),
    productCount: Number(productCount?.value ?? 0),
    todayQuantity: Number(todayQuantity?.value ?? 0),
    totalQuantity: Number(totalQuantity?.value ?? 0),
  };
}

export function getTodayMovementDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeBarcode(barcode: string): Barcode {
  const normalizedBarcode = barcode.replace(/\s+/g, '');

  if (normalizedBarcode.length < MIN_BARCODE_LENGTH) {
    throw new Error('O codigo de barras deve ter pelo menos 6 caracteres.');
  }

  return normalizedBarcode as Barcode;
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('A quantidade deve ser um numero inteiro maior que zero.');
  }

  return quantity;
}

function normalizeMovementDate(movementDate: string): MovementDate {
  const normalizedMovementDate = movementDate.trim();

  if (!MOVEMENT_DATE_PATTERN.test(normalizedMovementDate)) {
    throw new Error('A data da movimentacao deve estar no formato YYYY-MM-DD.');
  }

  const [year, month, day] = normalizedMovementDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) {
    throw new Error('A data da movimentacao deve ser uma data valida.');
  }

  return normalizedMovementDate as MovementDate;
}

function normalizeNote(note?: string): string | null {
  const normalizedNote = note?.trim();

  return normalizedNote ? normalizedNote : null;
}
