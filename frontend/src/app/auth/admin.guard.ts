import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () =>
  inject(AuthService).user()?.role === 'ADMIN'
    ? true
    : inject(Router).createUrlTree(['/products']);

