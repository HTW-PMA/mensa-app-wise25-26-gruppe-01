# UniEats (Mensa App Berlin)
UniEats ist eine mobile App für Studierende, die ihnen hilft, schnell und einfach die Speisepläne der umliegenden Mensen zu entdecken.

## 👥 Team & Roles

- **Pascal (Product Owner, Developers und Designers)** 🧑‍💻
- **Dongwoo Kim (Scrum Master, Developers und Designers)** 🧑‍💻
- **Navid (Developers und Designers)** 🧑‍💻
- **Viet (Developers und Designers)** 🧑‍💻


## 🛠️ Tech-Stack

- **Framework:** React Native mit Expo (Managed Workflow)
- **Sprache:** TypeScript
- **Navigation:** React Navigation (Tabs & Stacks)
- **State Management:** React Context API oder Zustand
- **API:** [Gregors Mensa API](https://mensa.gregorflachs.de/)
- **Code-Stil:** ESLint mit Konventionen für funktionale Komponenten und Hooks.

## 🎨 Design & Corporate Identity

- **Markenname:** UniEats
- **Primärfarbe:** `#02AA20` (UniEats Grün)
- **Akzentfarben:** `#000000` (Schwarz), `#FFFFFF` (Reinweiß), `#FFCC00` (Gelb)
- **Typografie:** Hauptschriftart "Inter", Ausweichschrift "Arial"
- **UI-Stil:** Modern, clean, mit abgerundeten Ecken und hoher Lesbarkeit (14-20pt).

## 🚀 Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go App](https://expo.dev/go) auf einem physischen Gerät (iOS oder Android).

### Installation & Start

1. **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
2. **App starten:**
    ```bash
    npx expo start --clear
    ```
3. **App öffnen:**
   - Expo Go App (QR-Code scannen)

## 🏗️ Projektstruktur

Die Codebasis folgt einer klaren und modularen Struktur, um die Wartbarkeit zu gewährleisten.

```
my-app_test/
├── /app/              # Screens und Navigation (Expo Router)
├── /assets/           # Statische Dateien (Bilder, Schriftarten)
├── /components/       # Wiederverwendbare UI-Komponenten
├── /constants/        # Globale Einstellungen (Theme, Farben)
├── /hooks/            # Wiederverwendbare Logik (React Hooks)
└── ...
```

## 👥 Rollenverteilung

- **Pascal (The Engine):** API-Anbindung, Caching, State Management, Push-Notifications.                                                  │
- **Dongwoo Kim (The Face):** UI/UX, Theme-System, Navigation-Setup, Splash Screen.                                                            │
- **Navid Gerig (The Navigator):** Google Maps Integration, Standort-Logik.                                                                    │
- **Viet (The Brain):** KI-Features (z.B. Meal-Matcher).

## 🤝 Code-Konventionen

- **Benennung:** Alle Komponenten, Variablen und Hooks werden auf **Englisch** benannt.
- **Commits:** Wir folgen den [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) Spezifikationen (z.B. `feat:`, `fix:`, `refactor:`).
- **Sicherheit:** API-Keys und andere sensible Daten werden ausschließlich über `.env` Dateien verwaltet und dürfen **niemals** im Code oder auf GitHub erscheinen.
