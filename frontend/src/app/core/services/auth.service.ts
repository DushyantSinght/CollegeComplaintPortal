import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    studentId?: string;
    department?: string;
  }): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/register`, data)
      .pipe(tap((user) => this.setSession(user)));
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((user) => this.setSession(user)));
  }

  updateProfile(data: {
    name?: string;
    email?: string;
    studentId?: string;
    department?: string;
  }): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/profile`, data)
      .pipe(tap((user) => this.setSession(user)));
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/password`, data);
  }

  private setSession(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', user.token || '');
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
