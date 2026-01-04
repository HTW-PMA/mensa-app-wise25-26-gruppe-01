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
- **Navigation:** Expo Router (File-based Routing)
- **State Management:** React Context API / React Hooks
- **API:** [Gregors Mensa API](https://mensa.gregorflachs.de/)
- **Code-Stil:** ESLint mit Konventionen für funktionale Komponenten und Hooks.

## 🎨 Design & Corporate Identity

- **Markenname:** UniEats
- **Primärfarbe:** `#02AA20` (UniEats Grün)
- **Akzentfarben:** `#000000` (Schwarz), `#FFFFFF` (Reinweiß), `#FFCC00` (Gelb)
- **Typografie:** Hauptschriftart "Google Sans", Ausweichschrift "Arial"
- **UI-Stil:** Modern, clean, mit abgerundeten Ecken und hoher Lesbarkeit.

## 🚀 Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go App](https://expo.dev/go) auf einem physischen Gerät (iOS oder Android) oder ein Simulator.

### Installation & Start

Da sich der App-Code im Ordner `uni-eats` befindet, müssen Sie zuerst dorthin navigieren.

1. **In das Projektverzeichnis wechseln:**
    ```bash
    cd uni-eats
    ```
2. **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
3. **App starten:**

   - **Standard (Expo Go):**
       ```bash
       npx expo start --clear
       ```
   - **Bei Änderungen an der Konfiguration oder an der Neuinstallation** 
   - **Alternative (Native Android Build):** *Falls die App bereits installiert wurde und Cache-Probleme auftreten:*
       ```bash
       # Build-Cache löschen und neu vorkonfigurieren
       cd uni-eats/android
       ``` 
       ```bash
       rm -rf app/build
       rm -rf app/.cxx
       ```  
       ```bash
       # zurück mensa-app-wise25-26-gruppe-01
       cd ..
       ```
       ```bash
       npx expo prebuild --platform android --clean
      ```     
   - **App direkt auf dem Gerät oder Emulator ausführen:**  
      ```bash
      npx expo run:android --device
      ```
4. **App öffnen:**
   - Scannen Sie den QR-Code mit der **Expo Go** App (Android/iOS).
   - Oder drücken Sie `w` für Web, `a` für Android Emulator, `i` für iOS Simulator.

## 🏗️ Projektstruktur

Die Codebasis befindet sich im Ordner `uni-eats` und folgt einer modularen Struktur:

```text
uni-eats/
├── app/                  # Screens und Navigation (Expo Router)
│   ├── (tabs)/           # Haupt-Tabs (index, explore, map, etc.)
│   ├── mensa-detail.tsx  # Detailansicht einer Mensa
│   └── _layout.tsx       # Globales Layout
├── assets/               # Statische Dateien (Bilder, Schriftarten)
├── components/           # Wiederverwendbare UI-Komponenten
│   ├── MensaCard.tsx     # Karte für die Mensa-Liste
│   └── ...
├── constants/            # Globale Einstellungen (Theme, Farben)
├── hooks/                # Custom React Hooks
├── screens/              # Screen-Logik (z.B. HomeScreen.tsx)
├── services/             # API-Dienste
│   └── mensaApi.ts       # Verbindung zur Mensa API
└── ...
```

## 👥 Rollenverteilung (Detailliert)

- **Pascal (The Engine):** API-Anbindung (Axios/Fetch), Caching, State Management.
- **Dongwoo Kim (The Face):** UI/UX Design, Theme-System, Navigation-Setup.
- **Navid Gerig (The Navigator):** Google Maps Integration, Standort-Logik.
- **Viet (The Brain):** KI-Features (z.B. Meal-Matcher).

## 🤝 Code-Konventionen

- **Benennung:** Englisch für Variablen, Funktionen und Komponenten (z.B. `HomeScreen`, `loadCanteens`).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (z.B. `feat: add mensa card`, `fix: layout issue`).
- **Komponenten:** Funktionale Komponenten mit Hooks.
- **Sicherheit:** Keine API-Keys im Code committen (`.env` nutzen).