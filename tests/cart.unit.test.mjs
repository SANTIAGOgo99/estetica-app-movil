import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCartItem, updateCartQuantity, cartTotal } from '../src/domain/commerce/cart.ts';
const item = { id: 3, name: 'Shampoo', price: 100, stock: 2, category: 'Cuidado', description: '' };
test('Carrito: suma sin mutar, limita por existencias y calcula el total', () => {
  const original = [];
  let lines = addCartItem(original, item, 1);
  assert.deepEqual(original, []);
  assert.equal(cartTotal(lines), 100);
  lines = addCartItem(lines, item, 5);
  assert.equal(lines.length, 1); assert.equal(lines[0].quantity, 2);
  assert.equal(cartTotal(lines), 200);
  for (const amount of [-1, 0, 1.5]) assert.equal(addCartItem(lines, item, amount), lines);
  assert.equal(addCartItem(lines, { ...item, stock: 0 }, 1), lines);
});
test('Carrito: modificar cantidad conserva otras líneas y elimina al llegar a cero', () => {
  const lines = addCartItem([], item, 1);
  assert.equal(updateCartQuantity(lines, item.id, 99)[0].quantity, 2);
  assert.deepEqual(updateCartQuantity(lines, item.id, 0), []);
  assert.equal(updateCartQuantity(lines, item.id, 1.5), lines);
  assert.equal(lines[0].quantity, 1);
});
