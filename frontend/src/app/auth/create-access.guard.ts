import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const createAccessGuard: CanActivateFn = () => {
  const user = inject(AuthService).user();
  return user?.role === 'ADMIN' || user?.access === 'CREATE'
    ? true
    : inject(Router).createUrlTree(['/products']);
};
