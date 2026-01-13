import { Component, inject, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class chat implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  chatState = inject(ChatStateService);
  inputValue = '';

  constructor() {
    // Effect to auto-scroll when messages change
    effect(() => {
      // Reading the signal triggers the effect when it changes
      this.chatState.messages();
      this.scrollToBottom();
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    try { 
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight; 
    } catch(e) {}
  }

  sendMessage() {
    if (!this.inputValue.trim()) return;

    const text = this.inputValue;
    this.inputValue = '';

    this.chatState.sendMessage(text);
  }

  // Expose signals for template
  get messages() { return this.chatState.messages(); }
  get isLoading() { return this.chatState.isLoading(); }
}