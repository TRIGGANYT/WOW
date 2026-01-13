import { Routes } from '@angular/router';
import { Aicoach } from './aicoach/aicoach';
import { Home } from './home/home';
import { Challenges } from './challenges/challenges';
import { Teamup } from './teamup/teamup';
import { Profile } from './profile/profile';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: Home },
  { path: 'aicoach', component: Aicoach },
  { path: 'challenges', component: Challenges },
  { path: 'teamup', component: Teamup },
  { path: 'profile', component: Profile },
];
