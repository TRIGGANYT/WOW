import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Team } from '../../services/team.service';
import { ButterflyNotificationService } from '../../services/butterfly-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-card.html',
  styleUrl: './team-card.css'
})
export class TeamCard implements OnInit, OnDestroy {
  @Input() team!: Team;
  @Input() isMember: boolean = false;
  @Output() join = new EventEmitter<string>();
  @Output() leave = new EventEmitter<string>();

  showButterfly = false;
  private butterflySubscription?: Subscription;

  constructor(
    private router: Router,
    private butterflyService: ButterflyNotificationService
  ) {}

  ngOnInit() {
    // Check if this team is the new team that triggered the butterfly
    this.butterflySubscription = this.butterflyService.newTeamId$.subscribe(newTeamId => {
      this.showButterfly = newTeamId === this.team._id;
    });
  }

  ngOnDestroy() {
    this.butterflySubscription?.unsubscribe();
  }

  onJoin() {
    // Navigate to team detail page
    this.router.navigate(['/team', this.team._id]);
  }

  onLeave() {
    this.leave.emit(this.team._id);
  }

  // Called when user clicks on the butterfly badge
  onButterflyClick(event: Event) {
    event.stopPropagation(); // Don't trigger join
    this.showButterfly = false;
    this.butterflyService.clearNewTeamId();
  }
}
