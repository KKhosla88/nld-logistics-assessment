import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { API_BASE_URL } from '../core/api-base-url.token';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart', imports: [CurrencyPipe, RouterLink],
  template: `
    <section><p class="eyebrow">Checkout</p><h1>Your cart</h1>
      @if (!cart.items().length) { <p class="panel">Your cart is empty. <a routerLink="/products">Browse products</a></p> }
      @else {
        <div class="items">@for (item of cart.items(); track item.product.id) {
          <article><div><strong>{{item.product.name}}</strong><small>{{item.product.sku}}</small></div>
            <input type="number" min="1" [max]="item.product.stockQty" [value]="item.quantity" (change)="change(item.product.id, $event)">
            <span>{{ +item.product.price * item.quantity | currency }}</span>
            <button class="remove" (click)="cart.remove(item.product.id)">Remove</button>
          </article>
        }</div>
        <div class="summary"><strong>Total: {{cart.total() | currency}}</strong><button (click)="checkout()" [disabled]="loading()">{{loading()?'Placing order…':'Place order'}}</button></div>
        @if (error()) { <p class="error">{{error()}}</p> }
      }
    </section>`,
  styles: [`h1{font-size:3rem}.eyebrow{color:#157e72;font-weight:700;text-transform:uppercase}.panel,.items,.summary{background:#fff;border-radius:.8rem;padding:1.25rem}.items{display:grid;gap:1rem}article{align-items:center;border-bottom:1px solid #e2e9ee;display:grid;gap:1rem;grid-template-columns:2fr 5rem 7rem auto;padding:1rem 0}small{display:block;color:#687d8e}input{padding:.5rem;width:4rem}.summary{display:flex;justify-content:space-between;margin-top:1rem}button{background:#0b1f33;border:0;border-radius:.4rem;color:#fff;padding:.7rem 1rem}.remove{background:transparent;color:#a12626}.error{color:#a12626}@media(max-width:40rem){article{grid-template-columns:1fr 4rem}.summary{gap:1rem;flex-direction:column}}`]
})
export class CartComponent {
  readonly cart = inject(CartService); private readonly http=inject(HttpClient); private readonly base=inject(API_BASE_URL); private readonly router=inject(Router);
  readonly loading=signal(false); readonly error=signal('');
  change(id:number,event:Event):void { this.cart.setQuantity(id, Number((event.target as HTMLInputElement).value)); }
  checkout():void { this.loading.set(true);this.error.set('');this.http.post(`${this.base}/orders`,{items:this.cart.items().map(i=>({productId:i.product.id,quantity:i.quantity}))}).subscribe({next:()=>{this.cart.clear();void this.router.navigate(['/orders']);},error:(e:HttpErrorResponse)=>{this.error.set(e.error?.error?.message??'Unable to place order');this.loading.set(false);}}); }
}

