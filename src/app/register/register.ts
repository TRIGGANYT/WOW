import { Component } from '@angular/core';
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
  email = '';
  password = '';
  error = '';
  success = '';
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  onRegister() {
    this.error = '';
    this.success = '';

    this.auth.register(this.email, this.password).subscribe({
      next: (res) => {
        this.success = res.message;
        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registrierung fehlgeschlagen';
      },
    });
  }
}
