import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <p class="eyebrow">Get started</p><h1>Create account</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email<input type="email" formControlName="email" autocomplete="email"></label>
        <label>Password<input type="password" formControlName="password" autocomplete="new-password"></label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Creating…' : 'Create account' }}</button>
      </form>
      <p>Already registered? <a routerLink="/login">Sign in</a></p>
    </section>
  `,
  styleUrl: './auth.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: (error: HttpErrorResponse) => { this.error.set(error.error?.error?.message ?? 'Unable to create account'); this.loading.set(false); }
    });
  }
}

