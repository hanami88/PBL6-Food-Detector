import {inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class  AuthService {
  private http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post('/api/auth/login', {
      email,
      password
    });
  }

  logout() {
    localStorage.removeItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

}
