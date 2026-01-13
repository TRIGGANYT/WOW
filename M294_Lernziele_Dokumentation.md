# 📚 Lernziele Fachgespräch M294 - Angular

Diese Dokumentation fasst alle Lernziele für das Fachgespräch M294 zusammen und enthält praktische Codebeispiele aus diesem Projekt (lern-app).

---

## Inhaltsverzeichnis

1. [Projektinitialisierung](#1-projektinitialisierung)
2. [Komponenten und Aufbau](#2-komponenten-und-aufbau)
3. [Datenbindung und Direktiven](#3-datenbindung-und-direktiven)
4. [Routing und Sicherheit](#4-routing-und-sicherheit)
5. [Formulare](#5-formulare)
6. [Beispielsituationen](#6-beispielsituationen)

---

## 1. Projektinitialisierung

### Angular-Projekt initialisieren

Ein neues Angular-Projekt wird mit der Angular CLI erstellt:

```bash
# Angular CLI global installieren
npm install -g @angular/cli

# Neues Projekt erstellen
ng new lern-app

# In das Projektverzeichnis wechseln
cd lern-app

# Entwicklungsserver starten
ng serve
```

### Wichtige Angular-Befehle

| Befehl                   | Beschreibung                                     |
| ------------------------ | ------------------------------------------------ |
| `npm install`            | Installiert alle Abhängigkeiten aus package.json |
| `ng serve`               | Startet den Entwicklungsserver (localhost:4200)  |
| `ng g c komponentenname` | Generiert eine neue Komponente                   |
| `ng g s servicename`     | Generiert einen neuen Service                    |
| `ng g p pipename`        | Generiert eine neue Pipe                         |
| `ng build`               | Erstellt einen Production-Build                  |

### Standalone: true vs. false

#### `standalone: true` (Modern - empfohlen seit Angular 17+)

- Komponente ist **eigenständig** und benötigt kein NgModule
- Imports werden direkt in der Komponente definiert
- **Beispiel aus unserem Projekt** (`src/app/login/login.ts`):

```typescript
@Component({
  standalone: true, // ← Komponente ist standalone
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink], // ← Imports direkt hier
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  // ...
}
```

#### `standalone: false` (Klassisch)

- Komponente muss in einem NgModule deklariert werden
- Imports werden im NgModule definiert

```typescript
// Klassische Variante (nicht in diesem Projekt verwendet)
@Component({
  standalone: false, // oder einfach weglassen
  selector: 'app-example',
  templateUrl: './example.html',
})
export class ExampleComponent {}

// Dazugehöriges Module
@NgModule({
  declarations: [ExampleComponent], // ← Hier deklarieren
  imports: [CommonModule, FormsModule],
})
export class ExampleModule {}
```

> **Fazit:** In modernen Angular-Projekten (wie unserem) werden Standalone-Komponenten bevorzugt, da sie den Code vereinfachen und Module-Boilerplate vermeiden.

---

## 2. Komponenten und Aufbau

### Dateien einer Komponente

Eine Angular-Komponente besteht typischerweise aus **4 Dateien**:

| Datei       | Funktion                                          |
| ----------- | ------------------------------------------------- |
| `*.ts`      | **TypeScript-Klasse** - Logik und Datenverwaltung |
| `*.html`    | **Template** - HTML-Struktur der Ansicht          |
| `*.css`     | **Styles** - Komponenten-spezifisches Styling     |
| `*.spec.ts` | **Tests** - Unit-Tests für die Komponente         |

**Beispiel: Chat-Komponente** (`src/app/aicoach/chat/`)

```
chat/
├── chat.ts       ← Logik (Nachrichten senden, Service-Aufrufe)
├── chat.html     ← Template (Nachrichtenliste, Input-Feld)
├── chat.css      ← Styling (Chat-Blasen, Layout)
└── chat.spec.ts  ← Tests
```

### Aufbau eines Angular-Projekts

```
lern-app/
├── src/
│   ├── app/
│   │   ├── app.ts              ← Root-Komponente
│   │   ├── app.html            ← Root-Template
│   │   ├── app.config.ts       ← App-Konfiguration (Provider)
│   │   ├── app.routes.ts       ← Routing-Konfiguration
│   │   │
│   │   ├── home/               ← Feature-Komponente
│   │   ├── login/              ← Feature-Komponente
│   │   ├── aicoach/            ← Feature-Komponente mit Sub-Komponenten
│   │   │   └── chat/           ← Child-Komponente
│   │   ├── nav/                ← Shared-Komponente
│   │   │
│   │   ├── services/           ← Services (Geschäftslogik)
│   │   │   ├── auth.service.ts
│   │   │   └── chat-state.service.ts
│   │   │
│   │   └── pipes/              ← Custom Pipes
│   │       └── markdown.pipe.ts
│   │
│   ├── assets/                 ← Statische Dateien (Bilder, etc.)
│   ├── index.html              ← HTML-Einstiegspunkt
│   └── styles.css              ← Globale Styles
│
├── angular.json                ← Angular CLI Konfiguration
├── package.json                ← NPM-Abhängigkeiten
└── tsconfig.json               ← TypeScript-Konfiguration
```

### Komponente erstellen

Mit der CLI eine neue Komponente erstellen:

```bash
ng g c profile
```

_Erzeugt:_

- `src/app/profile/profile.ts`
- `src/app/profile/profile.html`
- `src/app/profile/profile.css`
- `src/app/profile/profile.spec.ts`

---

## 3. Datenbindung und Direktiven

### One-way Binding (Einweg-Datenbindung)

Daten fliessen nur in **eine Richtung**: von der Komponente zum Template.

#### Interpolation `{{ }}`

```html
<!-- Aus chat.html -->
<span *ngIf="msg.sender === 'user'">{{ msg.text }}</span>
```

#### Property Binding `[ ]`

```html
<!-- Aus chat.html -->
<button [disabled]="isLoading" [class.loading]="isLoading">Senden</button>

<!-- Aus login.html -->
<input [type]="showPassword ? 'text' : 'password'" />
```

### Two-way Binding (Zwei-Wege-Datenbindung)

Daten fliessen in **beide Richtungen**: Änderungen im Template aktualisieren die Komponente und umgekehrt.

#### Syntax: `[(ngModel)]` (Banana-in-a-Box)

**Beispiel aus** `src/app/login/login.html`:

```html
<input [(ngModel)]="email" name="email" type="email" required />
<input [(ngModel)]="password" name="password" type="password" required />
```

**Dazugehörige TypeScript-Klasse** (`login.ts`):

```typescript
export class LoginComponent {
  email = ''; // ← Wird automatisch synchronisiert
  password = ''; // ← Wird automatisch synchronisiert
}
```

> **Wichtig:** Für `ngModel` muss `FormsModule` importiert werden:
>
> ```typescript
> imports: [FormsModule];
> ```

### Attribute Directives

#### ngClass

Fügt CSS-Klassen dynamisch hinzu.

**Beispiel aus** `src/app/aicoach/chat/chat.html`:

```html
<div
  class="message-row"
  [ngClass]="{'row-user': msg.sender === 'user', 'row-ai': msg.sender === 'ai'}"
>
  <div
    class="message-bubble"
    [ngClass]="{'bubble-user': msg.sender === 'user', 'bubble-ai': msg.sender === 'ai'}"
  >
    <!-- Nachrichteninhalt -->
  </div>
</div>
```

_Erklärt:_ Je nachdem, ob die Nachricht vom User oder der AI kommt, werden unterschiedliche CSS-Klassen angewendet.

#### ngStyle

Fügt Inline-Styles dynamisch hinzu.

```html
<!-- Allgemeines Beispiel -->
<div [ngStyle]="{'background-color': isActive ? 'green' : 'red', 'font-size': '16px'}">
  Dynamisches Styling
</div>
```

### Control Flow (@if und @for)

Seit Angular 17 gibt es die neue Control Flow Syntax:

#### @if - Bedingte Anzeige

```html
<!-- Moderne Syntax (Angular 17+) -->
@if (isLoggedIn) {
<p>Willkommen zurück!</p>
} @else {
<p>Bitte einloggen</p>
}
```

**Klassische Syntax mit `*ngIf`** (in unserem Projekt verwendet):

```html
<!-- Aus login.html -->
<p *ngIf="error" class="error">{{ error }}</p>

<!-- Aus chat.html -->
<span *ngIf="isLoading" class="spinner"></span>

<div class="avatar avatar-ai" *ngIf="msg.sender === 'ai'">
  <i class="fa-solid fa-robot"></i>
</div>
```

#### @for - Iteration über Listen

```html
<!-- Moderne Syntax (Angular 17+) -->
@for (item of items; track item.id) {
<li>{{ item.name }}</li>
}
```

**Klassische Syntax mit `*ngFor`** (in unserem Projekt verwendet):

```html
<!-- Aus chat.html -->
<div *ngFor="let msg of messages" class="message-row">
  <div class="message-bubble">{{ msg.text }}</div>
</div>
```

---

## 4. Routing und Sicherheit

### Routing-Modul einrichten

Das Routing in Angular ermöglicht die Navigation zwischen verschiedenen Komponenten (Seiten).

**Routing-Konfiguration** (`src/app/app.routes.ts`):

```typescript
import { Routes } from '@angular/router';
import { Aicoach } from './aicoach/aicoach';
import { Home } from './home/home';
import { Challenges } from './challenges/challenges';
import { Teamup } from './teamup/teamup';
import { Profile } from './profile/profile';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';

export const routes: Routes = [
  { path: '', component: LoginComponent }, // Standard-Route (Login)
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: Home },
  { path: 'aicoach', component: Aicoach },
  { path: 'challenges', component: Challenges },
  { path: 'teamup', component: Teamup },
  { path: 'profile', component: Profile },
];
```

**Router im Root-Template bereitstellen** (`src/app/app.html`):

```html
<router-outlet></router-outlet>

<ng-container *ngIf="showShell">
  <app-nav></app-nav>
</ng-container>
```

### Navigation zwischen Komponenten

#### Mit routerLink im Template

```html
<!-- Aus nav.html -->
<div class="nav">
  <a routerLink="/home" routerLinkActive="active">Home</a>
  <a routerLink="/teamup" routerLinkActive="active">Team-Up</a>
  <a routerLink="/challenges" routerLinkActive="active">Challenge</a>
  <a routerLink="/aicoach" routerLinkActive="active">AI-Mentor</a>
</div>
```

> `routerLinkActive="active"` fügt die CSS-Klasse "active" hinzu, wenn die Route aktiv ist.

#### Programmatische Navigation

```typescript
// Aus login.ts
import { Router } from '@angular/router';

export class LoginComponent {
  constructor(private router: Router) {}

  onLogin() {
    // Nach erfolgreichem Login zur Home-Seite navigieren
    this.router.navigateByUrl('/home');
  }
}
```

### Geschützte Routen (Route Guards)

Um Routen nur für bestimmte Nutzer (z.B. Admins) zugänglich zu machen, verwendet man **Guards**.

#### Beispiel: Auth Guard erstellen

```bash
ng g guard auth
```

**Implementierung eines Auth Guards:**

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true; // Zugriff erlaubt
  } else {
    router.navigateByUrl('/'); // Zur Login-Seite umleiten
    return false; // Zugriff verweigert
  }
};
```

**Admin Guard für rollenbasierte Zugriffskontrolle:**

```typescript
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.getUserRole() === 'admin') {
    return true;
  } else {
    router.navigateByUrl('/home');
    return false;
  }
};
```

**Guard in Routes einbinden:**

```typescript
export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'admin', component: AdminPanel, canActivate: [adminGuard] },
];
```

---

## 5. Formulare

### Template-driven Forms mit Validatoren

**Beispiel: Login-Formular** (`src/app/login/login.html`):

```html
<form (ngSubmit)="onLogin()">
  <div class="input-group">
    <label>Email</label>
    <input [(ngModel)]="email" name="email" type="email" required />
  </div>

  <div class="input-group">
    <label>Password</label>
    <div class="password-wrapper">
      <input
        [(ngModel)]="password"
        name="password"
        [type]="showPassword ? 'text' : 'password'"
        required
      />
      <span class="password-toggle" (click)="showPassword = !showPassword">
        <i class="fa-solid" [class.fa-eye]="!showPassword" [class.fa-eye-slash]="showPassword"></i>
      </span>
    </div>
  </div>

  <button type="submit" class="btn-login">Login</button>

  <p *ngIf="error" class="error">{{ error }}</p>
</form>
```

**TypeScript-Logik** (`src/app/login/login.ts`):

```typescript
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

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
```

### Formular mit erweiterter Validierung

**Kontaktformular-Beispiel:**

```html
<form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)">
  <div class="input-group">
    <label>Name *</label>
    <input ngModel name="name" required minlength="2" #name="ngModel" />
    <p *ngIf="name.invalid && name.touched" class="error">
      Name muss mindestens 2 Zeichen lang sein
    </p>
  </div>

  <div class="input-group">
    <label>Telefonnummer</label>
    <input ngModel name="phone" pattern="[0-9]{10,}" #phone="ngModel" />
    <p *ngIf="phone.invalid && phone.touched" class="error">Bitte gültige Telefonnummer eingeben</p>
  </div>

  <div class="input-group">
    <label>E-Mail *</label>
    <input ngModel name="email" type="email" required email #email="ngModel" />
    <p *ngIf="email.invalid && email.touched" class="error">
      Bitte gültige E-Mail-Adresse eingeben
    </p>
  </div>

  <div class="input-group">
    <label>Anfrage *</label>
    <textarea ngModel name="message" required minlength="10" #message="ngModel"></textarea>
    <p *ngIf="message.invalid && message.touched" class="error">
      Anfrage muss mindestens 10 Zeichen lang sein
    </p>
  </div>

  <button type="submit" [disabled]="contactForm.invalid">Absenden</button>
</form>
```

### Wichtige Validatoren

| Validator         | Beschreibung                      |
| ----------------- | --------------------------------- |
| `required`        | Feld muss ausgefüllt sein         |
| `email`           | Muss gültiges E-Mail-Format haben |
| `minlength="n"`   | Mindestlänge von n Zeichen        |
| `maxlength="n"`   | Maximallänge von n Zeichen        |
| `pattern="regex"` | Muss dem Regex-Muster entsprechen |

---

## 6. Beispielsituationen

### Wie würde ich ein Kontaktformular einbauen?

**1. Komponente erstellen:**

```bash
ng g c contact-form
```

**2. Routen erweitern** (`app.routes.ts`):

```typescript
{ path: 'contact', component: ContactFormComponent }
```

**3. Navigation hinzufügen** (`nav.html`):

```html
<a routerLink="/contact" routerLinkActive="active">Kontakt</a>
```

### Welche Komponenten für modularen Aufbau?

Für ein Kontaktformular-Feature:

```
app/
├── contact/
│   ├── contact.ts           ← Hauptkomponente (Container)
│   ├── contact.html
│   └── contact.css
│
├── shared/
│   ├── input-field/         ← Wiederverwendbares Input-Feld
│   │   ├── input-field.ts
│   │   └── input-field.html
│   │
│   └── form-button/         ← Wiederverwendbarer Button
│       ├── form-button.ts
│       └── form-button.html
│
└── services/
    └── contact.service.ts   ← API-Kommunikation
```

### Routing-Struktur für die Applikation

| Route         | Komponente        | Beschreibung         | Geschützt?     |
| ------------- | ----------------- | -------------------- | -------------- |
| `/`           | LoginComponent    | Login-Seite          | Nein           |
| `/register`   | RegisterComponent | Registrierung        | Nein           |
| `/home`       | Home              | Hauptseite           | Ja (authGuard) |
| `/aicoach`    | Aicoach           | AI-Mentor Chat       | Ja (authGuard) |
| `/challenges` | Challenges        | Challenges-Übersicht | Ja (authGuard) |
| `/teamup`     | Teamup            | Team-Up Bereich      | Ja (authGuard) |
| `/profile`    | Profile           | Benutzerprofil       | Ja (authGuard) |
| `/contact`    | ContactForm       | Kontaktformular      | Optional       |

---

## Zusammenfassung der wichtigsten Konzepte

| Konzept                   | Beschreibung                             | Beispiel                           |
| ------------------------- | ---------------------------------------- | ---------------------------------- |
| **Standalone Components** | Komponenten ohne NgModule                | `standalone: true`                 |
| **Two-way Binding**       | Datensynchronisation in beide Richtungen | `[(ngModel)]="email"`              |
| **ngClass**               | Dynamische CSS-Klassen                   | `[ngClass]="{'active': isActive}"` |
| **Control Flow**          | Bedingte Anzeige & Schleifen             | `*ngIf`, `*ngFor`                  |
| **Routing**               | Navigation zwischen Komponenten          | `routerLink="/home"`               |
| **Guards**                | Routenschutz                             | `canActivate: [authGuard]`         |
| **Template-driven Forms** | Formulare mit ngModel                    | `(ngSubmit)="onSubmit()"`          |
| **Validators**            | Eingabevalidierung                       | `required`, `email`, `minlength`   |
