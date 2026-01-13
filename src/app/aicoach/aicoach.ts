import { Component } from '@angular/core';
import { chat } from "./chat/chat";
import { Nav } from "../nav/nav";

@Component({
  selector: 'app-aicoach',
  standalone: true,
  templateUrl: './aicoach.html',
  styleUrl: './aicoach.css',
  imports: [chat, Nav],
})
export class Aicoach {

}
