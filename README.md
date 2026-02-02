# UniEats (Mensa App Berlin)

UniEats ist eine moderne mobile App für Berliner Studierende, die den Uni-Alltag kulinarisch bereichert. Mit UniEats findest du schnell die besten Mahlzeiten in den Mensen der Stadt, personalisiert durch KI und ergänzt durch nützliche Features wie Standortsuche und Favoriten.

---

## ✨ Hauptfunktionen

- **🔍 Intelligente Suche:** Durchsuche Mahlzeiten und Mensen in Echtzeit mit Verlauf und beliebten Kategorien (Vegan, Pasta, etc.).
- **📍 Karten-Integration:** Finde Mensen in deiner Nähe mit Google Maps und erhalte Informationen zu Öffnungszeiten und Preisen.
- **🤖 AI Chef:** Erhalte personalisierte Menü-Empfehlungen basierend auf deinen Vorlieben und Ernährungsbedürfnissen.
- **⭐ Favoriten:** Speichere deine Lieblingsmensen und -gerichte für den schnellen Zugriff.
- **🌍 Mehrsprachigkeit:** Vollständige Unterstützung für Deutsch und Englisch.
- **🌓 Dark/Light Mode:** Adaptives Design, das sich den Systemeinstellungen deines Smartphones anpasst.
- **🔔 Benachrichtigungen:** Verpasse kein Lieblingsgericht mehr durch individuelle Meal-Alerts.

---

## 👥 Team & Rollen

- **Pascal (The Engine):** API-Anbindung, Caching, State Management & PO.
- **Dongwoo Kim (The Face):** UI/UX Design, Theme-System, Navigation & Scrum Master.
- **Navid Gerig (The Navigator):** Google Maps Integration, Standort-Logik & Entwickler.
- **Viet (The Brain):** KI-Features (Meal-Matcher) & Entwickler.

---

## 🛠️ Tech-Stack

- **Framework:** [React Native](https://reactnative.dev/) mit [Expo](https://expo.dev/) (Managed Workflow)
- **Sprache:** [TypeScript](https://www.typescriptlang.org/)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based Routing)
- **Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Backend/Auth:** [Firebase](https://firebase.google.com/)
- **API:** [Gregors Mensa API](https://mensa.gregorflachs.de/) & Google Places API
- **Styling:** Custom Theme System mit Dark/Light Mode Unterstützung

---

## 🚀 Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS Version empfohlen)
- [Expo Go App](https://expo.dev/go) auf deinem Smartphone (iOS/Android) oder ein installierter Emulator (Android Studio / Xcode).

### Installation

1. **Repository klonen:**
   ```bash
   git clone https://github.com/HTW-PMA/mensa-app-wise25-26-gruppe-01.git
   cd mensa-app-wise25-26-gruppe-01
   ```

2. **In das App-Verzeichnis wechseln und Abhängigkeiten installieren:**
   ```bash
   cd uni-eats
   npm install
   ```

3. **Umgebungsvariablen einrichten:**
   Erstelle eine Datei namens `.env` im Ordner `uni-eats/` (nutze `.env.example` als Vorlage):
   ```bash
   cp .env.example .env
   ```
   *Hinweis: Du benötigst einen API-Key von [mensa.gregorflachs.de](https://mensa.gregorflachs.de/) und ein Firebase-Projekt für die Authentifizierung.*

### App starten & Entwickeln

#### 🍎 iOS (iPhone)
Aufgrund von Sicherheitsbeschränkungen im lokalen Netzwerk wird ein Tunnel benötigt:
```bash
npx expo start --tunnel --clear
```
Scanne dann den QR-Code mit der Kamera-App.

#### 🤖 Android
Hier gibt es zwei Modi, je nach Anwendungszweck:

**1. Entwicklungs-Modus (Empfohlen zum Testen):**
Ideal für schnelles Feedback. Änderungen am Code werden sofort in der App reflektiert (Hot Reloading).
```bash
npx expo run:android
```
*Dies erfordert, dass der Metro Server (Expo Go) im Hintergrund läuft.*

**2. Release-Modus (Vollständige Installation):**
Installiert die App als eigenständige APK auf dem Gerät. Dies entspricht der echten App-Erfahrung ohne Abhängigkeit vom Development Server.
```bash
npx expo run:android --variant release
```

#### 🌐 Web
```bash
npx expo start --web
```
*Hinweis: Karten- und Standortfunktionen sind im Web eingeschränkt.*

---

## 🏗️ Projektstruktur

```text
uni-eats/
├── app/                  # Screens und Navigation (Expo Router)
│   ├── (auth)/           # Login, Registrierung, Profilvervollständigung
│   ├── (tabs)/           # Hauptnavigation (Home, Explore, Map, AI, Search, Account)
│   └── ...               # Detailseiten (Mensa, Mahlzeiten)
├── assets/               # Bilder, Fonts und Logos
├── components/           # Wiederverwendbare UI-Komponenten (Atomic Design Ansatz)
├── config/               # Firebase & API Konfigurationen
├── contexts/             # React Context für globalen State (Auth, Favoriten, AI)
├── hooks/                # Custom React Hooks für Logik-Kapselung
├── locales/              # Übersetzungsdateien (DE/EN)
├── services/             # API-Clients (Mensa, Google, AI)
└── utils/                # Hilfsfunktionen und Validierungen
```

---

## 🔧 Fehlerbehebung & Clean Install

Falls die App beim Starten abstürzt oder alte Daten aus dem Cache Probleme verursachen (z.B. nach einem Pull von Änderungen), führe einen kompletten Reset durch:

**Android Cache & Build bereinigen:**
```bash
# 1. Android-Ordner löschen (entfernt alte Builds vollständig)
rm -rf android

# 2. Native Dateien sauber neu generieren
npx expo prebuild --platform android --clean

# 3. App neu installieren (wähle dev oder release)
npx expo run:android
```

---

## 💡 Hinweise zum Testen

- **Standort:** Für die Kartenfunktion wird ein Standort benötigt. Im Emulator kann dieser manuell gesetzt werden. Auf echten Geräten muss GPS aktiviert sein.
- **Authentifizierung:** Einige Funktionen (Favoriten, AI-Chef Verlauf) erfordern einen Login. Du kannst dich einfach mit einer Test-E-Mail registrieren.
- **Cache löschen (Allgemein):**
  ```bash
  npx expo start --clear
  ```

---

## 🤝 Code-Konventionen

- **Sprache:** Code und Kommentare sind in Englisch.
- **Commits:** Wir nutzen [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (z.B. `feat:`, `fix:`, `refactor:`).
- **Architektur:** Strikte Trennung von Logik (Hooks) und Darstellung (Komponenten).
- **Sicherheit:** Sensible Daten gehören ausschließlich in die `.env` Datei.
