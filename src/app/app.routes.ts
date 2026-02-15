import { Routes } from '@angular/router';
import { Aicoach } from './aicoach/aicoach';
import { Home } from './home/home';
import { Challenges } from './challenges/challenges';
import { Teamup } from './teamup/teamup';
import { TeamDetail } from './teamup/team-detail/team-detail';
import { Profile } from './profile/profile';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { VerifyComponent } from './verify/verify';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify', component: VerifyComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'aicoach', component: Aicoach, canActivate: [authGuard] },
  { path: 'challenges', component: Challenges, canActivate: [authGuard] },
  { path: 'teamup', component: Teamup, canActivate: [authGuard] },
  { path: 'team/:id', component: TeamDetail, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
];
