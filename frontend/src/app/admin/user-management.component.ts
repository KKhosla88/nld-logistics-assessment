import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api-base-url.token';
import type { User } from '../auth/auth.models';

interface UserPage {
  data: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

@Component({
  selector: 'app-user-management',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <section>
      <p class="eyebrow">Administration</p>
      <h1>Users</h1>
      <p class="intro">Search accounts and grant or remove ordering access. Users must sign in again after an access change.</p>
      <input class="search" type="search" [formControl]="search" placeholder="Search by email" aria-label="Search users by email">
      @if (message()) { <p class="message" role="status">{{ message() }}</p> }
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (loading()) { <p class="panel">Loading users…</p> }
      @else if (!users().length) { <p class="panel">No users found.</p> }
      @else {
        <div class="table-wrap"><table>
          <thead><tr><th>Email</th><th>Role</th><th>Access</th><th>Created</th></tr></thead>
          <tbody>@for (user of users(); track user.id) {
            <tr><td>{{ user.email }}</td><td>{{ user.role }}</td><td>
              <select [value]="user.access" [disabled]="user.role === 'ADMIN' || savingId() === user.id" (change)="changeAccess(user, $event)">
                <option value="VIEW">VIEW</option><option value="CREATE">CREATE</option>
              </select>
            </td><td>{{ user.createdAt | date:'mediumDate' }}</td></tr>
          }</tbody>
        </table></div>
        <div class="pager"><button (click)="previous()" [disabled]="page() === 1">Previous</button><span>Page {{ page() }} of {{ totalPages() || 1 }}</span><button (click)="next()" [disabled]="page() >= totalPages()">Next</button></div>
      }
    </section>
  `,
  styles: [`
    h1{font-size:3rem;margin:.3rem 0}.eyebrow{color:#157e72;font-weight:700;text-transform:uppercase}.intro{color:#526678;max-width:45rem}.search{border:1px solid #bdcbd5;border-radius:.5rem;margin:1.5rem 0;padding:.8rem;width:min(100%,30rem)}.table-wrap,.panel{background:#fff;border-radius:.8rem;overflow:auto;padding:1rem}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e2e9ee;padding:1rem;text-align:left}th{color:#526678;font-size:.75rem;text-transform:uppercase}select{border:1px solid #bdcbd5;border-radius:.4rem;padding:.5rem}.pager{display:flex;gap:1rem;justify-content:center;margin-top:1rem}.message{color:#157e72}.error{color:#a12626}
  `]
})
export class UserManagementComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  readonly search = new FormControl('', { nonNullable: true });
  readonly users = signal<User[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly savingId = signal<number | null>(null);
  readonly error = signal('');
  readonly message = signal('');

  constructor() {
    this.search.valueChanges.pipe(
      startWith(''), debounceTime(300), distinctUntilChanged(),
      tap(() => this.page.set(1)),
      switchMap(() => this.fetchUsers())
    ).subscribe({
      next: (result) => this.applyResult(result),
      error: (error: HttpErrorResponse) => this.handleError(error, 'Unable to load users')
    });
  }

  changeAccess(user: User, event: Event): void {
    const access = (event.target as HTMLSelectElement).value as User['access'];
    this.savingId.set(user.id); this.error.set(''); this.message.set('');
    this.http.patch<{ user: User }>(`${this.baseUrl}/admin/users/${user.id}/access`, { access }).subscribe({
      next: ({ user: updated }) => {
        this.users.update((users) => users.map((item) => item.id === updated.id ? updated : item));
        this.message.set(`${updated.email} now has ${updated.access} access.`);
        this.savingId.set(null);
      },
      error: (error: HttpErrorResponse) => { this.handleError(error, 'Unable to update access'); this.load(); }
    });
  }

  previous(): void { this.page.update((page) => Math.max(1, page - 1)); this.load(); }
  next(): void { this.page.update((page) => page + 1); this.load(); }
  private load(): void { this.fetchUsers().subscribe({ next: (result) => this.applyResult(result), error: (error: HttpErrorResponse) => this.handleError(error, 'Unable to load users') }); }
  private fetchUsers() { this.loading.set(true); this.error.set(''); const params = new HttpParams().set('search', this.search.value).set('page', this.page()).set('limit', 20); return this.http.get<UserPage>(`${this.baseUrl}/admin/users`, { params }); }
  private applyResult(result: UserPage): void { this.users.set(result.data); this.totalPages.set(result.pagination.totalPages); this.loading.set(false); }
  private handleError(error: HttpErrorResponse, fallback: string): void { this.error.set(error.error?.error?.message ?? fallback); this.loading.set(false); this.savingId.set(null); }
}

