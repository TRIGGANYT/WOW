import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService, User } from '../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  user: User | null = null;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user data', err);
      }
    });
  }

  getMentorProgress(): number {
    if (!this.user) return 0;
    return this.userService.getLevelProgress(this.user.mentorXp, this.user.mentorLevel);
  }

  getChallengeProgress(): number {
    if (!this.user) return 0;
    return this.userService.getLevelProgress(this.user.challengeXp, this.user.challengeLevel);
  }

  getMentorTitle(): string {
    if (!this.user) return 'Explorer';
    return this.userService.getLevelTitle(this.user.mentorLevel);
  }

  getChallengeTitle(): string {
    if (!this.user) return 'Explorer';
    return this.userService.getLevelTitle(this.user.challengeLevel);
  }

  getElfLevel(): number {
    if (!this.user) return 1;
    return Math.max(this.user.mentorLevel, this.user.challengeLevel);
  }

  getElfTitle(): string {
    return this.userService.getLevelTitle(this.getElfLevel());
  }

  getElfImage(): string {
    const level = this.getElfLevel();
    if (level >= 9) return 'assets/images/WOW_Elf_Master_No_BG.png';
    if (level >= 5) return 'assets/images/WOW_Elf_Designer_No_BG.png';
    return 'assets/images/WOW_Elf_Explorer_No_BG.png';
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}