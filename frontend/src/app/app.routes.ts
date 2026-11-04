import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { createAccessGuard } from './auth/create-access.guard';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { ProductListComponent } from './products/product-list.component';
import { CartComponent } from './cart/cart.component';
import { OrderListComponent } from './orders/order-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'products', component: ProductListComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard, createAccessGuard] },
  { path: 'orders', component: OrderListComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: '**', redirectTo: 'products' }
];
