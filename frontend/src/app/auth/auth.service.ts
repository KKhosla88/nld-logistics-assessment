import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

import { API_BASE_URL } from '../core/api-base-url.token';
import type { LoginResponse, User } from './auth.models';

const SESSION_KEY = 'nld-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly session = signal<LoginResponse | null>(this.readSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  login(credentials: { email: string; password: string }) {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, credentials).pipe(
      tap((session) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.session.set(session);
      })
    );
  }

  register(credentials: { email: string; password: string; role: 'ADMIN' | 'USER' }) {
    return this.http.post<{ user: User }>(`${this.apiBaseUrl}/auth/register`, credentials);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
  }

  private readSession(): LoginResponse | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) as LoginResponse : null;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}

