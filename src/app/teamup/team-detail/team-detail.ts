import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService, Team, TeamMember, ChatMessage } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { TeamSessionService } from '../../services/team-session.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css'
})
export class TeamDetail implements OnInit, OnDestroy {
  teamId: string = '';
  team: Team | null = null;
  currentUserId: string | null = null;

  // Chat
  messages: ChatMessage[] = [];
  newMessage: string = '';
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
  // Timer properties
  elapsedSeconds: number = 0;
  timerDisplay: string = '00:00:00';
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  
  // Polling for member updates
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000; // 3 Sekunden
  private hasLeftRoom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private userService: UserService,
    private teamSession: TeamSessionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.teamId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    this.loadCurrentUserAndTeam();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopPolling();
    // Team session stays active — TeamSessionService handles beforeunload globally
  }

  private startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.refreshTeamData();
    });
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private refreshTeamData(): void {
    if (!this.teamId) return;
    this.teamService.getTeamById(this.teamId).subscribe({
      next: (team) => {
        this.team = team;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          // Token expired — clear session and redirect to login
          this.teamSession.clearActiveTeam();
          this.stopTimer();
          this.stopPolling();
          this.router.navigate(['/']);
          return;
        }
        if (err.status === 404) {
          this.hasLeftRoom = true;
          this.stopTimer();
          this.stopPolling();
          alert('Der Raum wurde durch Mehrheitsentscheidung aufgelöst.');
          this.router.navigate(['/teamup']);
        }
      }
    });
    // Also refresh messages
    this.loadMessages();
  }

  loadMessages(): void {
    this.teamService.getMessages(this.teamId).subscribe({
      next: (messages) => {
        const hadMessages = this.messages.length;
        this.messages = messages;
        this.cdr.detectChanges();
        // Auto-scroll if new messages arrived
        if (messages.length > hadMessages) {
          this.scrollToBottom();
        }
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentUserId) return;
    const text = this.newMessage.trim();
    this.newMessage = '';
    this.teamService.sendMessage(this.teamId, this.currentUserId, text).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });
  }

  isMyMessage(msg: ChatMessage): boolean {
    return msg.sender._id === this.currentUserId;
  }

  getSenderName(msg: ChatMessage): string {
    if (msg.sender.username) return msg.sender.username;
    if (msg.sender.email) return msg.sender.email.split('@')[0];
    return 'Unbekannt';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  private loadCurrentUserAndTeam(): void {
    // First load the current user
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user._id;
        // Register with global session service for beforeunload handling
        this.teamSession.setActiveTeam(this.teamId, user._id);
        this.loadTeamData();
      },
      error: (err) => {
        console.error('Error loading current user:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  private loadTeamData(): void {
    if (!this.teamId) {
      console.error('No teamId provided!');
      return;
    }
    
    this.teamService.getTeamById(this.teamId).subscribe({
      next: (team) => {
        this.team = team;
        
        // Auto-join if not already a member
        this.autoJoinIfNeeded(team);
        
        // Calculate elapsed time since team was created
        const createdAt = new Date(team.createdAt);
        const now = new Date();
        this.elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
        this.updateTimerDisplay();
        this.startTimer();
        this.startPolling();
        this.loadMessages();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading team:', err);
      }
    });
  }

  private autoJoinIfNeeded(team: Team): void {
    if (!this.currentUserId) return;
    
    // Check if current user is already a member
    const isMember = team.members.some(m => m._id === this.currentUserId);
    
    if (!isMember && team.members.length < team.maxMembers) {
      this.teamService.joinTeam(this.teamId, this.currentUserId).subscribe({
        next: (joinedTeam) => {
          this.team = joinedTeam;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error joining team:', err);
        }
      });
    }
  }

  private startTimer(): void {
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        this.ngZone.run(() => {
          this.updateTimerDisplay();
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerDisplay(): void {
    const hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;
    
    this.timerDisplay = [hours, minutes, seconds]
      .map(unit => unit.toString().padStart(2, '0'))
      .join(':');
  }

  // Get display name for a member (prefer username)
  getMemberDisplayName(member: TeamMember): string {
    if (member.username) return member.username;
    if (member.email) return member.email.split('@')[0];
    return 'Unbekannt';
  }


  leaveRoom(): void {
    if (!this.currentUserId) {
      this.router.navigate(['/teamup']);
      return;
    }
    
    this.hasLeftRoom = true;
    this.teamSession.clearActiveTeam();
    this.stopTimer();
    this.stopPolling();
    this.teamService.leaveTeam(this.teamId, this.currentUserId).subscribe({
      next: () => {
        this.router.navigate(['/teamup']);
      },
      error: (err) => {
        console.error('Error leaving room:', err);
        this.router.navigate(['/teamup']);
      }
    });
  }

  voteDissolve(): void {
    if (!this.currentUserId || !this.team) return;
    
    this.teamService.voteDissolve(this.teamId, this.currentUserId).subscribe({
      next: (response) => {
        if (response.dissolved) {
          // Team was dissolved by majority vote
          this.hasLeftRoom = true;
          this.stopTimer();
          this.stopPolling();
          alert('Der Raum wurde durch Mehrheitsentscheidung aufgelöst.');
          this.router.navigate(['/teamup']);
        } else if (response.team) {
          // Update team with new vote count
          this.team = response.team;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error voting to dissolve:', err);
        alert('Fehler beim Abstimmen. Bitte versuche es erneut.');
      }
    });
  }

  hasVoted(): boolean {
    if (!this.currentUserId || !this.team?.dissolveVotes) return false;
    return this.team.dissolveVotes.some(v => v._id === this.currentUserId);
  }

  getVotesNeeded(): number {
    if (!this.team) return 0;
    return Math.floor(this.team.members.length / 2) + 1;
  }

  getCurrentVotes(): number {
    if (!this.team?.dissolveVotes) return 0;
    return this.team.dissolveVotes.length;
  }

  // === Rating ===
  showRatingOverlay = false;
  ratingTarget: TeamMember | null = null;
  selectedStars = 0;
  ratingFeedback = '';

  openRating(member: TeamMember): void {
    if (member._id === this.currentUserId) return;
    this.ratingTarget = member;
    this.selectedStars = 0;
    this.ratingFeedback = '';
    this.showRatingOverlay = true;
  }

  closeRating(): void {
    this.showRatingOverlay = false;
    this.ratingTarget = null;
    this.selectedStars = 0;
  }

  setStars(stars: number): void {
    this.selectedStars = stars;
  }

  submitRating(): void {
    if (!this.selectedStars || !this.ratingTarget || !this.currentUserId) return;

    this.teamService.rateMember(
      this.teamId, this.currentUserId, this.ratingTarget._id, this.selectedStars
    ).subscribe({
      next: (res) => {
        this.ratingFeedback = res.message;
        setTimeout(() => this.closeRating(), 2000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.ratingFeedback = err.error?.message || 'Fehler bei der Bewertung';
        this.cdr.detectChanges();
      }
    });
  }

  // Dummy challenge XP for testing
  addChallengeXp(): void {
    this.userService.addXp('challenge', 50).subscribe({
      next: (res) => {
        alert(`+50 Challenge XP! Neues Level: ${res.challengeLevel}`);
      }
    });
  }
}
