import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface User {
  _id: string;
  email: string;
  username?: string;
  age?: number;
  hobbies: string[];
  lifeStage?: string;
  mentorXp: number;
  mentorLevel: number;
  challengeXp: number;
  challengeLevel: number;
}

export interface Rating {
  _id: string;
  rater: { _id: string; email: string; username?: string };
  ratedUser: string;
  team: { _id: string; name: string };
  stars: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/auth/me';
  private authApiUrl = 'http://localhost:3000/api/auth';

  // Cached user data
  private cachedUser = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Returns cached user instantly if available, otherwise fetches from API.
   * Subsequent calls after the first fetch return the cached value immediately.
   */
  getCurrentUser(): Observable<User> {
    const cached = this.cachedUser.getValue();
    if (cached) {
      return of(cached);
    }
    return this.fetchUser();
  }

  /** Force a fresh fetch from the API (e.g. after XP changes). */
  refreshUser(): Observable<User> {
    return this.fetchUser();
  }

  private fetchUser(): Observable<User> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<User>(this.apiUrl, { headers }).pipe(
      tap(user => this.cachedUser.next(user))
    );
  }

  /** Clear the cache (call on logout). */
  clearCache(): void {
    this.cachedUser.next(null);
  }

  deleteAccount(): Observable<{ message: string }> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<{ message: string }>(this.apiUrl, { headers });
  }

  addXp(type: 'mentor' | 'challenge', amount: number): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.authApiUrl}/add-xp`, { type, amount }, { headers }).pipe(
      tap(() => this.fetchUser().subscribe()) // Refresh cache after XP change
    );
  }

  getRatingHistory(userId: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.authApiUrl}/ratings/${userId}`);
  }

  updateProfile(data: { username?: string; age?: number; hobbies?: string[]; lifeStage?: string }): Observable<User> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<User>(this.apiUrl, data, { headers }).pipe(
      tap(user => this.cachedUser.next(user)) // Update cache with new profile data
    );
  }

  // Level titles tied to elf characters
  getLevelTitle(level: number): string {
    if (level >= 9) return 'Master';
    if (level >= 5) return 'Designer';
    return 'Explorer';
  }

  // XP needed for next level
  getXpForNextLevel(level: number): number {
    return Math.round(100 * Math.pow(1.5, level - 1));
  }

  // Cumulative XP at start of a level
  getXpAtLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += Math.round(100 * Math.pow(1.5, i - 1));
    }
    return total;
  }

  // Progress percentage within current level
  getLevelProgress(xp: number, level: number): number {
    const xpAtLevel = this.getXpAtLevel(level);
    const xpForNext = this.getXpForNextLevel(level);
    return Math.min(((xp - xpAtLevel) / xpForNext) * 100, 100);
  }
}
