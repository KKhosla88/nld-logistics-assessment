import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../core/api-base-url.token';

interface Order { id:number; orderNumber:string; status:'PENDING'|'CONFIRMED'|'CANCELLED'; totalAmount:string; createdAt:string; itemCount:number; }
interface OrderPage { data:Order[]; pagination:{page:number;limit:number;total:number;totalPages:number}; }

@Component({
  selector:'app-order-list', imports:[CurrencyPipe,DatePipe,FormsModule],
  template:`<section><p class="eyebrow">History</p><h1>Orders</h1>
    <div class="filters"><select [(ngModel)]="status"><option value="">All statuses</option><option>PENDING</option><option>CONFIRMED</option><option>CANCELLED</option></select><input type="date" [(ngModel)]="from"><input type="date" [(ngModel)]="to"><button (click)="load()">Apply filters</button></div>
    @if(message()){<p class="message">{{message()}}</p>} @if(error()){<p class="error">{{error()}}</p>}
    @if(loading()){<p class="panel">Loading orders…</p>} @else if(!orders().length){<p class="panel">No orders found.</p>} @else {
      <div class="orders">@for(order of orders();track order.id){<article><div><strong>{{order.orderNumber}}</strong><small>{{order.createdAt|date:'medium'}} · {{order.itemCount}} items</small></div><span class="status">{{order.status}}</span><strong>{{+order.totalAmount|currency}}</strong>@if(order.status!=='CANCELLED'){<button (click)="cancel(order.id)">Cancel</button>}</article>}</div>
      <div class="pager"><button (click)="previous()" [disabled]="page()===1">Previous</button><span>Page {{page()}} of {{totalPages()||1}}</span><button (click)="next()" [disabled]="page()>=totalPages()">Next</button></div>
    }
  </section>`,
  styles:[`h1{font-size:3rem}.eyebrow{color:#157e72;font-weight:700;text-transform:uppercase}.filters{display:flex;flex-wrap:wrap;gap:.7rem;margin-bottom:1.5rem}.filters>*{border:1px solid #bdcbd5;border-radius:.45rem;padding:.65rem}.orders,.panel{background:#fff;border-radius:.8rem;padding:1rem}.orders{display:grid;gap:.5rem}article{align-items:center;border-bottom:1px solid #e2e9ee;display:grid;gap:1rem;grid-template-columns:2fr 8rem 7rem auto;padding:1rem}small{color:#687d8e;display:block;margin-top:.35rem}.status{font-size:.75rem;font-weight:700}.pager{display:flex;justify-content:center;gap:1rem;margin-top:1rem}button{cursor:pointer}.error{color:#a12626}.message{color:#157e72}@media(max-width:45rem){article{grid-template-columns:1fr 1fr}}`]
})
export class OrderListComponent {
  private readonly http=inject(HttpClient);private readonly base=inject(API_BASE_URL);
  readonly orders=signal<Order[]>([]);readonly loading=signal(true);readonly error=signal('');readonly message=signal('');readonly page=signal(1);readonly totalPages=signal(0);
  status='';from='';to='';
  constructor(){this.load();}
  load():void{this.loading.set(true);this.error.set('');let params=new HttpParams().set('page',this.page()).set('limit',10);if(this.status)params=params.set('status',this.status);if(this.from)params=params.set('from',this.from);if(this.to)params=params.set('to',this.to);this.http.get<OrderPage>(`${this.base}/orders`,{params}).subscribe({next:r=>{this.orders.set(r.data);this.totalPages.set(r.pagination.totalPages);this.loading.set(false);},error:(e:HttpErrorResponse)=>{this.error.set(e.error?.error?.message??'Unable to load orders');this.loading.set(false);}});}
  cancel(id:number):void{this.error.set('');this.http.post(`${this.base}/orders/${id}/cancel`,{}).subscribe({next:()=>{this.message.set('Order cancelled and stock restored.');this.load();},error:(e:HttpErrorResponse)=>this.error.set(e.error?.error?.message??'Unable to cancel order')});}
  previous():void{this.page.update(p=>Math.max(1,p-1));this.load();} next():void{this.page.update(p=>p+1);this.load();}
}

