import { useCallback, useEffect, useState } from 'react';

export interface CartLine {
  productId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  unit: string;
  quantity: number;
  maxStock: number;
}

const KEY = 'compos.shopCart';
const EVT = 'compos:cartChange';

function read(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartLine[];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => read());

  useEffect(() => {
    const handler = () => setLines(read());
    window.addEventListener(EVT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const add = useCallback((line: Omit<CartLine, 'quantity'>, qty = 1) => {
    const cur = read();
    const existing = cur.find((l) => l.productId === line.productId);
    if (existing) {
      const next = Math.min(line.maxStock, existing.quantity + qty);
      existing.quantity = next;
      existing.maxStock = line.maxStock;
      existing.price = line.price;
      existing.name = line.name;
      existing.imageUrl = line.imageUrl;
      existing.unit = line.unit;
    } else {
      cur.push({ ...line, quantity: Math.min(line.maxStock, Math.max(1, qty)) });
    }
    write(cur);
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    const cur = read();
    const idx = cur.findIndex((l) => l.productId === productId);
    if (idx < 0) return;
    const clamped = Math.max(1, Math.min(cur[idx].maxStock, qty));
    cur[idx].quantity = clamped;
    write(cur);
  }, []);

  const remove = useCallback((productId: string) => {
    write(read().filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0);

  return { lines, add, setQuantity, remove, clear, itemCount, subtotal };
}
