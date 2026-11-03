export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  access: 'VIEW' | 'CREATE';
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

