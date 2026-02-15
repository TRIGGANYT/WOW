import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UserService, User, Rating } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: User | null = null;
  isLoading = true;
  displayName = 'Laden...';
  showDeleteConfirm = false;

  // Rating History
  showRatingHistory = false;
  ratings: Rating[] = [];

  // Edit Modal
  showEditModal = false;
  editUsername = '';
  editAge = 20;
  editLifeStage = '';
  editHobbies: string[] = [];
  editError = '';

  lifeStageOptions = [
    { value: 'schueler', label: 'Schüler/in' },
    { value: 'lehrling', label: 'Lehrling' },
    { value: 'student', label: 'Student/in' },
    { value: 'berufserfahren', label: 'Berufserfahren' },
    { value: 'pensioniert', label: 'Pensioniert' },
  ];

  availableHobbies = [
    { icon: 'fa-solid fa-gamepad', label: 'Gaming' },
    { icon: 'fa-solid fa-book', label: 'Lesen' },
    { icon: 'fa-solid fa-music', label: 'Musik' },
    { icon: 'fa-solid fa-futbol', label: 'Sport' },
    { icon: 'fa-solid fa-palette', label: 'Kunst' },
    { icon: 'fa-solid fa-code', label: 'Programmieren' },
    { icon: 'fa-solid fa-utensils', label: 'Kochen' },
    { icon: 'fa-solid fa-plane', label: 'Reisen' },
    { icon: 'fa-solid fa-camera', label: 'Fotografie' },
    { icon: 'fa-solid fa-film', label: 'Filme' },
    { icon: 'fa-solid fa-mountain', label: 'Klettern' },
    { icon: 'fa-solid fa-guitar', label: 'Instrument' },
    { icon: 'fa-solid fa-dumbbell', label: 'Fitness' },
    { icon: 'fa-solid fa-seedling', label: 'Gärtnern' },
    { icon: 'fa-solid fa-dice', label: 'Brettspiele' },
    { icon: 'fa-solid fa-pen', label: 'Schreiben' },
    { icon: 'fa-solid fa-spa', label: 'Yoga' },
    { icon: 'fa-solid fa-bicycle', label: 'Radfahren' },
    { icon: 'fa-solid fa-masks-theater', label: 'Theater' },
    { icon: 'fa-solid fa-paw', label: 'Tiere' },
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
        if (user.username) {
          this.displayName = user.username;
        } else if (user.email) {
          this.displayName = user.email.split('@')[0];
        } else {
          this.displayName = 'Unbekannt';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Profile: Fehler beim Laden:', err);
        this.isLoading = false;
        this.displayName = 'Nicht eingeloggt';
        this.cdr.detectChanges();
      }
    });
  }

  getHobbyIcon(hobbyLabel: string): string {
    const found = this.availableHobbies.find(h => h.label === hobbyLabel);
    return found ? found.icon : 'fa-solid fa-circle';
  }

  // Edit Modal
  openEditModal(): void {
    if (!this.user) return;
    this.editUsername = this.user.username || '';
    this.editAge = this.user.age || 20;
    this.editLifeStage = this.user.lifeStage || '';
    this.editHobbies = [...(this.user.hobbies || [])];
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  toggleEditHobby(label: string): void {
    const idx = this.editHobbies.indexOf(label);
    if (idx >= 0) {
      this.editHobbies.splice(idx, 1);
    } else {
      this.editHobbies.push(label);
    }
  }

  isEditHobbySelected(label: string): boolean {
    return this.editHobbies.includes(label);
  }

  saveProfile(): void {
    if (!this.editUsername.trim()) {
      this.editError = 'Benutzername darf nicht leer sein.';
      return;
    }
    if (this.editHobbies.length === 0) {
      this.editError = 'Wähle mindestens ein Interesse aus.';
      return;
    }

    this.editError = '';
    this.userService.updateProfile({
      username: this.editUsername.trim(),
      age: this.editAge,
      hobbies: this.editHobbies,
      lifeStage: this.editLifeStage,
    }).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.displayName = updatedUser.username || updatedUser.email.split('@')[0];
        this.showEditModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.editError = err.error?.message || 'Fehler beim Speichern.';
        this.cdr.detectChanges();
      }
    });
  }

  // XP & Level methods
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

  getElfImage(): string {
    const level = this.getElfLevel();
    if (level >= 9) return 'assets/images/WOW_Elf_Master_No_BG.png';
    if (level >= 5) return 'assets/images/WOW_Elf_Designer_No_BG.png';
    return 'assets/images/WOW_Elf_Explorer_Seite_No_BG.png';
  }

  getMentorXpNeeded(): number {
    if (!this.user) return 100;
    return this.userService.getXpForNextLevel(this.user.mentorLevel);
  }

  getChallengeXpNeeded(): number {
    if (!this.user) return 100;
    return this.userService.getXpForNextLevel(this.user.challengeLevel);
  }

  getMentorXpInLevel(): number {
    if (!this.user) return 0;
    return this.user.mentorXp - this.userService.getXpAtLevel(this.user.mentorLevel);
  }

  getChallengeXpInLevel(): number {
    if (!this.user) return 0;
    return this.user.challengeXp - this.userService.getXpAtLevel(this.user.challengeLevel);
  }

  // Rating History
  openRatingHistory(): void {
    if (!this.user) return;
    this.userService.getRatingHistory(this.user._id).subscribe({
      next: (ratings) => {
        this.ratings = ratings;
        this.showRatingHistory = true;
        this.cdr.detectChanges();
      }
    });
  }

  closeRatingHistory(): void {
    this.showRatingHistory = false;
  }

  getRaterName(rating: Rating): string {
    if (rating.rater?.username) return rating.rater.username;
    if (rating.rater?.email) return rating.rater.email.split('@')[0];
    return 'Unbekannt';
  }

  getStarsDisplay(stars: number): string {
    return '⭐'.repeat(stars);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  logout(): void {
    this.userService.clearCache();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  deleteAccount(): void {
    this.userService.deleteAccount().subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.userService.clearCache();
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Fehler beim Löschen:', err);
        this.showDeleteConfirm = false;
      }
    });
  }
}
