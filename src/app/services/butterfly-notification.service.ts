import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ButterflyNotificationService {
  private triggerSource = new Subject<void>();
  trigger$ = this.triggerSource.asObservable();

  // Store the ID of the newly created team that triggered the butterfly
  private newTeamIdSource = new BehaviorSubject<string | null>(null);
  newTeamId$ = this.newTeamIdSource.asObservable();

  triggerButterfly() {
    this.triggerSource.next();
  }

  // Set the new team ID when a team is created
  setNewTeamId(teamId: string) {
    this.newTeamIdSource.next(teamId);
  }

  // Clear the new team ID (e.g., when butterfly is dismissed)
  clearNewTeamId() {
    this.newTeamIdSource.next(null);
  }

  // Get current new team ID
  getNewTeamId(): string | null {
    return this.newTeamIdSource.getValue();
  }
}
