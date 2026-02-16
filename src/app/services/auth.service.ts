import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';
  private apiUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/login`, {
      email,
      password,
    });
  }

  register(email: string, password: string, username: string, age: number | null, hobbies: string[], lifeStage: string): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.apiUrl}/register`, {
      email,
      password,
      username,
      age,
      hobbies,
      lifeStage,
    });
  }

  verifyEmail(email: string, code: string): Observable<{ message: string; accessToken: string }> {
    return this.http.post<{ message: string; accessToken: string }>(`${this.apiUrl}/verify`, { email, code });
  }

  resendCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resend-code`, { email });
  }

  checkAvailable(email?: string, username?: string): Observable<{ emailAvailable?: boolean; usernameAvailable?: boolean }> {
    const params: any = {};
    if (email) params.email = email;
    if (username) params.username = username;
    return this.http.get<{ emailAvailable?: boolean; usernameAvailable?: boolean }>(`${this.apiUrl}/check-available`, { params });
  }

  saveToken(token: string) {
    sessionStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}