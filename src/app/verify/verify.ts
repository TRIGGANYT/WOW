import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-verify',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify.html',
  styleUrls: ['./verify.css']
})
export class VerifyComponent implements OnInit {
  email = '';
  code = '';
  error = '';
  success = '';
  resendCooldown = 0;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!this.email) {
      this.router.navigateByUrl('/register');
    }
  }

  onVerify(): void {
    this.error = '';
    this.success = '';

    if (!this.code || this.code.length !== 6) {
      this.error = 'Bitte gib den 6-stelligen Code ein.';
      return;
    }

    this.auth.verifyEmail(this.email, this.code).subscribe({
      next: (res) => {
        this.auth.saveToken(res.accessToken);
        this.success = 'Email verifiziert! Weiterleitung...';
        setTimeout(() => this.router.navigateByUrl('/home'), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Verifizierung fehlgeschlagen';
      },
    });
  }

  onResend(): void {
    if (this.resendCooldown > 0) return;

    this.error = '';
    this.auth.resendCode(this.email).subscribe({
      next: () => {
        this.success = 'Neuer Code wurde gesendet!';
        this.startCooldown();
      },
      error: (err) => {
        this.error = err.error?.message || 'Code konnte nicht gesendet werden';
      },
    });
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0 && this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }
}
