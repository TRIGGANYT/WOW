import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Nav } from "./nav/nav";
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('lern-app');

  constructor(private router: Router) {}

  get showShell(): boolean {
    const url = this.router.url;
    return url !== '/' && !url.startsWith('/register');
  }
}
