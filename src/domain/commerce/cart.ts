import type { Item } from '../catalog/Item.ts';
export type CartLine = { item: Item; quantity: number };

export function addCartItem(lines: CartLine[], item: Item, amount: number): CartLine[] {
  const stock = item.stock ?? 0;
  if (stock <= 0 || !Number.isInteger(amount) || amount < 1) return lines;
  const found = lines.find(line => line.item.id === item.id);
  const quantity = Math.min(stock, (found?.quantity ?? 0) + amount);
  return found ? lines.map(line => line.item.id === item.id ? { item, quantity } : line) : [...lines, { item, quantity }];
}

export function updateCartQuantity(lines: CartLine[], id: number, value: number): CartLine[] {
  if (!Number.isInteger(value)) return lines;
  return lines.map(line => line.item.id === id ? { ...line, quantity: Math.max(0, Math.min(value, line.item.stock ?? 0)) } : line).filter(line => line.quantity > 0);
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.item.price * line.quantity, 0);
}
