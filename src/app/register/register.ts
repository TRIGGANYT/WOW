import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  currentStep = 1;
  totalSteps = 3;

  // Step 1
  email = '';
  password = '';
  showPassword = false;

  // Step 2
  username = '';
  lifeStage = '';
  age = 20;

  lifeStageOptions = [
    { value: 'schueler', label: 'Schüler/in' },
    { value: 'lehrling', label: 'Lehrling' },
    { value: 'student', label: 'Student/in' },
    { value: 'berufserfahren', label: 'Berufserfahren' },
    { value: 'pensioniert', label: 'Pensioniert' },
  ];

  // Step 3
  hobbies: { icon: string; label: string }[] = [];
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

  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.email || !this.password) {
        this.error = 'Bitte fülle alle Felder aus.';
        return;
      }
      if (this.password.length < 6) {
        this.error = 'Passwort muss mindestens 6 Zeichen lang sein.';
        return;
      }
      // Check email availability
      this.error = '';
      this.auth.checkAvailable(this.email).subscribe({
        next: (res) => {
          if (res.emailAvailable === false) {
            this.error = 'Diese Email ist bereits registriert.';
          } else {
            this.currentStep++;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          // If check fails, let user proceed (register endpoint has its own check)
          this.currentStep++;
          this.cdr.detectChanges();
        }
      });
      return;
    }
    if (this.currentStep === 2) {
      if (!this.username) {
        this.error = 'Bitte gib einen Benutzernamen ein.';
        return;
      }
      // Check username availability
      this.error = '';
      this.auth.checkAvailable(undefined, this.username).subscribe({
        next: (res) => {
          if (res.usernameAvailable === false) {
            this.error = 'Dieser Benutzername ist bereits vergeben.';
          } else {
            this.currentStep++;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          // If check fails, let user proceed (register endpoint has its own check)
          this.currentStep++;
          this.cdr.detectChanges();
        }
      });
      return;
    }
    this.error = '';
    this.currentStep++;
  }

  prevStep(): void {
    this.error = '';
    this.currentStep--;
  }

  toggleHobby(hobby: { icon: string; label: string }): void {
    const idx = this.hobbies.findIndex(h => h.label === hobby.label);
    if (idx >= 0) {
      this.hobbies.splice(idx, 1);
    } else {
      this.hobbies.push(hobby);
    }
  }

  isHobbySelected(hobby: { icon: string; label: string }): boolean {
    return this.hobbies.some(h => h.label === hobby.label);
  }

  removeHobby(index: number): void {
    this.hobbies.splice(index, 1);
  }

  onRegister(): void {
    this.error = '';
    this.success = '';

    if (this.hobbies.length === 0) {
      this.error = 'Wähle mindestens ein Interesse aus.';
      return;
    }

    this.auth.register(
      this.email, this.password, this.username,
      this.age, this.hobbies.map(h => h.label), this.lifeStage
    ).subscribe({
      next: (res) => {
        this.success = 'Verifikationscode wurde an deine Email gesendet!';
        setTimeout(() => this.router.navigate(['/verify'], { queryParams: { email: this.email } }), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registrierung fehlgeschlagen';
      },
    });
  }
}
