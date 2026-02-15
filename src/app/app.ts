import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, NavigationStart } from '@angular/router';
import { Nav } from "./nav/nav";
import { NgIf } from '@angular/common';
import { ButterflyAnimation } from './shared/butterfly-animation/butterfly-animation';
import { ButterflyNotificationService } from './services/butterfly-notification.service';
import { TeamService } from './services/team.service';
import { AuthService } from './services/auth.service';
import { Subscription, interval, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, NgIf, ButterflyAnimation],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  showButterfly = false;
  private butterflySubscription?: Subscription;
  private teamPollingSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000; // 3 seconds

  constructor(
    private router: Router,
    private butterflyService: ButterflyNotificationService,
    private teamService: TeamService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Subscribe to manual butterfly triggers (only on home)
    this.butterflySubscription = this.butterflyService.trigger$.subscribe(() => {
      if (this.isOnHomePage()) {
        this.showButterfly = true;
      }
    });

    // Hide butterfly when navigating away from home OR when navigating to Team-Up
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        // Hide when navigating away from home OR when going to team-up (user saw notification)
        if (!event.url.includes('/home') || event.url.includes('/teamup')) {
          this.showButterfly = false;
        }
      });

    // Start polling for new teams (only if logged in)
    if (this.authService.isLoggedIn()) {
      this.startTeamPolling();
    }
  }

  ngOnDestroy() {
    this.butterflySubscription?.unsubscribe();
    this.teamPollingSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private startTeamPolling() {
    // Initial load
    this.checkForNewTeams();

    // Poll every 3 seconds
    this.teamPollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.checkForNewTeams();
      }
    });
  }

  private lastTeamIds: Set<string> = new Set();
  private isFirstLoad = true;

  private checkForNewTeams() {
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        const currentTeamIds = new Set(teams.map(t => t._id));

        // If not first load, check for new teams
        if (!this.isFirstLoad) {
          // Find newly added team IDs
          for (const teamId of currentTeamIds) {
            if (!this.lastTeamIds.has(teamId)) {
              // Store the new team ID for the butterfly badge
              this.butterflyService.setNewTeamId(teamId);
              if (this.isOnHomePage()) {
                this.showButterfly = true;
                this.cdr.detectChanges(); // Force view update
              }
              break; // Only process one new team at a time
            }
          }
        }

        this.lastTeamIds = currentTeamIds;
        this.isFirstLoad = false;
      },
      error: (err) => {
        console.error('Team polling error:', err);
      }
    });
  }

  private isOnHomePage(): boolean {
    return this.router.url === '/home';
  }

  onButterflyComplete() {
    this.showButterfly = false;
  }

  get showShell(): boolean {
    const url = this.router.url;
    return url !== '/' && !url.startsWith('/register') && !url.startsWith('/verify');
  }
}
