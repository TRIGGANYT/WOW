import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Wenn bereits eingeloggt, zu Home weiterleiten
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/home');
    }
  }

  onLogin() {
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.saveToken(res.accessToken);
        this.router.navigateByUrl('/home');
      },
      error: () => {
        this.error = 'Login fehlgeschlagen';
      },
    });
  }
}