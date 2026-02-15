import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService, Team } from '../services/team.service';
import { TeamCard } from './team-card/team-card';
import { CreateTeamModal } from './create-team-modal/create-team-modal';
import { ButterflyNotificationService } from '../services/butterfly-notification.service';
import { UserService } from '../services/user.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-teamup',
  standalone: true,
  imports: [CommonModule, TeamCard, CreateTeamModal],
  templateUrl: './teamup.html',
  styleUrl: './teamup.css',
})
export class Teamup implements OnInit, OnDestroy {
  teams: Team[] = [];
  showCreateModal = false;
  currentUserId: string | null = null;
  isLoading = true;
  
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000; // 3 Sekunden

  constructor(
    private teamService: TeamService,
    private cdr: ChangeDetectorRef,
    private butterflyService: ButterflyNotificationService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private loadCurrentUser() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user._id;
        this.loadTeams();
        this.startPolling();
      },
      error: (err) => {
        console.error('Error loading current user:', err);
        this.isLoading = false;
        // Redirect to login if not authenticated
        this.router.navigate(['/login']);
      }
    });
  }

  private startPolling() {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadTeams();
    });
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadTeams() {
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.isLoading = false;

        // Auto-redirect to active team if user is already a member
        if (this.currentUserId) {
          const activeTeam = teams.find(t => t.members.some(m => m._id === this.currentUserId));
          if (activeTeam) {
            this.router.navigate(['/team', activeTeam._id]);
            return;
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading teams:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.loadTeams(); // Refresh teams when modal closes
  }

  createTeam(data: { name: string; description: string; icon: string; maxMembers: number }) {
    if (!this.currentUserId) return;
    this.teamService.createTeam({ ...data, creatorId: this.currentUserId }).subscribe({
      next: (createdTeam) => {
        this.closeCreateModal();
        // Navigate directly to the new team room
        this.router.navigate(['/team', createdTeam._id]);
      },
      error: (err) => {
        console.error('Error creating team:', err);
      }
    });
  }

  joinTeam(teamId: string) {
    if (!this.currentUserId) return;
    this.teamService.joinTeam(teamId, this.currentUserId).subscribe({
      next: () => {
        this.loadTeams();
      },
      error: (err) => {
        console.error('Error joining team:', err);
      }
    });
  }

  leaveTeam(teamId: string) {
    if (!this.currentUserId) return;
    this.teamService.leaveTeam(teamId, this.currentUserId).subscribe({
      next: () => {
        this.loadTeams();
      },
      error: (err) => {
        console.error('Error leaving team:', err);
      }
    });
  }

  isMember(team: Team): boolean {
    if (!this.currentUserId) return false;
    return team.members.some(m => m._id === this.currentUserId);
  }
}

