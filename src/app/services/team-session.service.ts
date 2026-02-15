import { Injectable } from '@angular/core';

/**
 * Tracks the user's active team session globally.
 * Handles sending a beacon-leave when the browser tab is closed,
 * even if the user has navigated away from the TeamDetail page.
 */
@Injectable({ providedIn: 'root' })
export class TeamSessionService {
  private activeTeamId: string | null = null;
  private activeUserId: string | null = null;

  constructor() {
    // Global beforeunload listener — persists across all route changes
    window.addEventListener('beforeunload', () => {
      this.sendBeaconLeave();
    });
  }

  /** Call when user enters a team room */
  setActiveTeam(teamId: string, userId: string): void {
    this.activeTeamId = teamId;
    this.activeUserId = userId;
  }

  /** Call when user explicitly leaves a team (button click) */
  clearActiveTeam(): void {
    this.activeTeamId = null;
    this.activeUserId = null;
  }

  getActiveTeamId(): string | null {
    return this.activeTeamId;
  }

  private sendBeaconLeave(): void {
    if (!this.activeTeamId || !this.activeUserId) return;

    const url = `http://localhost:3000/api/teams/${this.activeTeamId}/beacon-leave`;
    const data = JSON.stringify({ userId: this.activeUserId });
    navigator.sendBeacon(url, new Blob([data], { type: 'text/plain' }));

    this.activeTeamId = null;
    this.activeUserId = null;
  }
}
