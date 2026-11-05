import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';

import { API_BASE_URL } from '../core/api-base-url.token';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';
import type { Product, ProductPage } from './product.models';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, ReactiveFormsModule],
  template: `
    <section class="catalog">
      <div><p class="eyebrow">Catalog</p><h1>Products</h1></div>
      <input [formControl]="search" type="search" placeholder="Search name or SKU" aria-label="Search products">
      @if (loading()) { <p class="state">Loading products…</p> }
      @else if (error()) { <p class="state error" role="alert">{{ error() }}</p> }
      @else if (!products().length) { <p class="state">No products match your search.</p> }
      @else {
        <div class="grid">
          @for (product of products(); track product.id) {
            <article><p class="sku">{{ product.sku }}</p><h2>{{ product.name }}</h2><p>{{ product.stockQty }} in stock</p><strong>{{ +product.price | currency }}</strong>@if(canCreate()){<button (click)="cart.add(product)" [disabled]="product.stockQty===0">Add to cart</button>}</article>
          }
        </div>
        <div class="pagination">
          <p class="total">{{ total() }} products · Page {{ page() }} of {{ totalPages() }}</p>
          <div><button (click)="goToPage(page() - 1)" [disabled]="page() === 1 || loading()">Previous</button><button (click)="goToPage(page() + 1)" [disabled]="page() >= totalPages() || loading()">Next</button></div>
        </div>
      }
    </section>
  `,
  styles: [`
    .catalog{display:grid;gap:2rem}.eyebrow,.sku{color:#157e72;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}h1{font-size:3rem;margin:.3rem 0}input{border:1px solid #bdcbd5;border-radius:.6rem;max-width:32rem;padding:.9rem}.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}article{background:#fff;border:1px solid #dce5eb;border-radius:.8rem;padding:1.3rem}button{background:#0b1f33;border:0;border-radius:.4rem;color:#fff;padding:.6rem 1rem}button:disabled{cursor:not-allowed;opacity:.45}article button{display:block;margin-top:1rem;width:100%}h2{font-size:1.1rem;min-height:2.7rem}.state{background:#fff;border-radius:.7rem;padding:2rem}.error{color:#a12626}.total{color:#526678}.pagination{align-items:center;display:flex;gap:1rem;justify-content:space-between}.pagination div{display:flex;gap:.6rem}@media(max-width:35rem){.pagination{align-items:stretch;flex-direction:column}.pagination div button{flex:1}}
  `]
})
export class ProductListComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly canCreate = () => this.auth.user()?.role === 'ADMIN' || this.auth.user()?.access === 'CREATE';
  readonly search = new FormControl('', { nonNullable: true });
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.search.valueChanges.pipe(
      startWith(''), debounceTime(300), distinctUntilChanged(),
      tap(() => { this.page.set(1); this.loading.set(true); this.error.set(''); }),
      switchMap((search) => this.requestPage(search, 1).pipe(
        catchError((error: HttpErrorResponse) => {
          this.error.set(error.error?.error?.message ?? 'Unable to load products');
          this.loading.set(false);
          return of({ data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
        })
      )),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe({
      next: (result) => this.applyResult(result),
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.loading.set(true); this.error.set('');
    this.requestPage(this.search.value, page).subscribe({
      next: (result) => this.applyResult(result),
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.error?.message ?? 'Unable to load products');
        this.loading.set(false);
      }
    });
  }

  private requestPage(search: string, page: number) {
    return this.http.get<ProductPage>(`${this.baseUrl}/products`, { params: { search, page, limit: 12 } });
  }

  private applyResult(result: ProductPage): void {
    this.products.set(result.data);
    this.total.set(result.pagination.total);
    this.page.set(result.pagination.page);
    this.totalPages.set(Math.max(1, result.pagination.totalPages));
    this.loading.set(false);
  }
}

