import { computed, Injectable, signal } from '@angular/core';
import type { Product } from '../products/product.models';

export interface CartItem { product: Product; quantity: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = signal<CartItem[]>([]);
  readonly items = this.state.asReadonly();
  readonly itemCount = computed(() => this.state().reduce((sum, item) => sum + item.quantity, 0));
  readonly total = computed(() => this.state().reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0));

  add(product: Product): void {
    const existing = this.state().find((item) => item.product.id === product.id);
    this.state.set(existing
      ? this.state().map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQty) } : item)
      : [...this.state(), { product, quantity: 1 }]);
  }

  setQuantity(productId: number, quantity: number): void {
    this.state.update((items) => items.map((item) => item.product.id === productId
      ? { ...item, quantity: Math.max(1, Math.min(Math.trunc(quantity), item.product.stockQty)) }
      : item));
  }

  remove(productId: number): void { this.state.update((items) => items.filter((item) => item.product.id !== productId)); }
  clear(): void { this.state.set([]); }
}

