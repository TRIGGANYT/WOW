# WOW - DialogApp �

Eine Plattform für Lernen durch Dialog. Hier steht der Austausch im Mittelpunkt – sei es mit anderen Lernenden in Teams oder mit dem AI-Coach. Das Wissen entsteht nicht durch Pauken, sondern durch Kommunikation.

![WOW App Screenshot](src/assets/images/wow-background.png)

## 💡 Philosophie

Lernen passiert am besten im Gespräch. WOW fördert diesen Austausch:

- **Miteinander reden:** In Team-Rooms diskutieren und voneinander lernen.
- **Mit KI reflektieren:** Der AI-Coach ist dein Dialogpartner, der dir hilft, Themen zu durchdringen.
- **Wachsen durch Austausch:** XP gibt es nicht nur für Aufgaben, sondern vor allem für wertvolle Beiträge im Dialog.

## ✨ Features

- **Dialog-Teams �️**: Live-Chat Räume, in denen Diskussionen und Zusammenarbeit im Vordergrund stehen.
- **AI Dialog-Partner 🤖**: Ein intelligenter Coach (OpenRouter), der dich in tiefgehende Gespräche verwickelt, statt nur Antworten zu liefern.
- **Avatar Entwicklung 🧝**: Dein Elf wächst mit der Qualität deiner Interaktionen (Explorer -> Designer -> Master).
- **XP durch Kommunikation 📊**:
  - **Challenge XP**: Für das aktive Einbringen in Diskussionen.
  - **Mentor XP**: Für das Erklären und Helfen im Dialog.
- **Sicherer Austausch 🔐**: Verifizierte Accounts (Email-Code) für eine vertrauensvolle Umgebung.

## 🛠️ Tech Stack

- **Frontend**:
  - Angular 19 (Standalone Components, Signals)
  - TypeScript
  - Custom UI (Fokus auf Lesbarkeit und Ästhetik)
- **Backend**:
  - Node.js & Express
  - REST API für Echtzeit-nahe Kommunikation
- **Datenbank**:
  - MongoDB Atlas (Cloud)
- **Services**:
  - Nodemailer (Verifizierung)
  - OpenRouter API (AI-Dialog)

## 🚀 Installation & Start

### Voraussetzungen

- Node.js & npm installiert
- MongoDB Atlas Connection String
- SMTP Server Zugangsdaten

### 1. Projekt klonen

```bash
git clone <repository-url>
cd lern-app
```

### 2. Backend starten (Kommunikations-Server)

```bash
cd backend
npm install
```

Erstelle eine `.env` Datei im `backend` Ordner:

```env
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=dein_secret
SMTP_HOST=...
SMTP_PORT=465
SMTP_USER=...
SMTP_PASS='...'
```

```bash
npm run dev
```

### 3. App starten

```bash
cd ..
npm install
ng serve
```

Öffne `http://localhost:4200` für den Dialog.

## 📂 Struktur

- `src/app/aicoach`: Der KI-Dialogpartner
- `src/app/teamup`: Die Team-Chat-Räume
- `src/app/profile`: Dein Avatar und Fortschritt
- `backend/`: API für Nachrichten und Benutzerdaten

## 🤝 Mitwirken

Wir freuen uns über Pull Requests, die den Austausch auf der Plattform weiter fördern!
