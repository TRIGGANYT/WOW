import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-team-modal.html',
  styleUrl: './create-team-modal.css'
})
export class CreateTeamModal {
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<{ name: string; description: string; icon: string; maxMembers: number }>();

  name: string = '';
  description: string = '';
  icon: string = '<i class="fa-solid fa-people-group"></i>';
  maxMembers: number = 8;

  icons: string[] = [
    '<i class="fa-solid fa-people-group"></i>',
    '<i class="fa-solid fa-laptop-code"></i>',
    '<i class="fa-solid fa-lightbulb"></i>',
    '<i class="fa-solid fa-rocket"></i>',
    '<i class="fa-solid fa-bullseye"></i>',
    '<i class="fa-solid fa-book"></i>',
    '<i class="fa-solid fa-brain"></i>',
    '<i class="fa-solid fa-bolt"></i>',
    '<i class="fa-solid fa-palette"></i>',
    '<i class="fa-solid fa-microscope"></i>',
    '<i class="fa-solid fa-chess"></i>',
    '<i class="fa-solid fa-star"></i>'
  ];

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.name.trim()) {
      this.create.emit({
        name: this.name,
        description: this.description,
        icon: this.icon,
        maxMembers: this.maxMembers
      });
    }
  }

  selectIcon(icon: string) {
    this.icon = icon;
  }
}
