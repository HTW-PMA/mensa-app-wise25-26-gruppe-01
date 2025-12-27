# To-Do-List: UniEats (WiSe25/26-Gruppe-01)

## 1. Funktionale Anforderungen
- [ ] **App-Identität:** Die App besitzt einen individuellen Namen und ein passendes Icon, das zum Thema und zur Zielgruppe passt. Die App soll einen wiedererkennbaren Charakter haben.
- [ ] **Übersicht und Navigation:** Es gibt eine übersichtliche Darstellung der verfügbaren Mensen. Nutzer:innen können sich leicht orientieren und gewünschte Informationen finden.
- [ ] **Speiseinformationen:** Nutzer:innen können die angebotenen Speisen und Preise in einer verständlichen, aktuellen und informativen Darstellung einsehen.
- [ ] **Personalisierung:** Einstellungen oder Präferenzen (z.B. Lieblingsmensa oder Lieblingsspeisen) können gespeichert werden.
- [ ] **Zusatzinformationen:** Hinweise zu Inhaltsstoffen oder Allergenen sind verfügbar.
- [ ] **Künstliche Intelligenz:** Ein KI-basiertes Feature erweitert die App um ein modernes, intelligentes Element (z.B. Meal Matcher).
- [ ] **Benachrichtigungen:** Die App kann Nutzer:innen aktiv informieren oder erinnern (Push-Notifications).

## 2. Qualitätsanforderungen
- [ ] **Code-Struktur:** Der Code ist logisch aufgebaut, gut lesbar und fördert Wiederverwendung (Funktionale Komponenten, Hooks).
- [ ] **State Management:** Zustände und Datenflüsse sind konsistent und klar nachvollziehbar.
- [ ] **Offline-Fähigkeit:** Die App funktioniert in Grundzügen auch ohne Internet (lokale Speicherung).
- [ ] **Fehlerbehandlung:** Die App reagiert robust auf Probleme und zeigt verständliche Fehlermeldungen.
- [ ] **Versionshistorie:** Commits sind sinnvoll getrennt und folgen den "Conventional Commits".
- [ ] **Dokumentation:** Eine kurze, verständliche Dokumentation (README) beschreibt Installation und Nutzung.
- [ ] **Sicherheit:** Sensible Daten wie API-Keys sind sicher eingebunden (via .env) und nicht öffentlich auf GitHub.

## 3. Aufgabenverteilung (Kanban)

### 👤 Person A – The Engine (API, Data, State)
*Du bist das Herzstück der App. Ohne dich ist die App nur eine hübsche Hülle ohne Inhalt.*
- **Mensa-API Anbindung:** API-Key sicher einbinden, Daten abrufen (Axios/Fetch).
- **State Management:** Globalen State aufsetzen (Context/Zustand), Daten filtern.
- **Offline-Fähigkeit:** AsyncStorage implementieren.
- **Benachrichtigungen:** Lokale Push-Notifications programmieren.

### 🎨 Person B – The Face (UI & Screens)
*Du sorgst dafür, dass die App sich anfühlt wie "UniEats" – grün, modern, clean.*
- **App-Identität:** Theme-System (Farben, Fonts), Icon, Splash Screen.
- **Navigation:** Routing (Tabs/Stacks) aufsetzen.
- **Komponenten:** Wiederverwendbare UI-Komponenten (Cards, Header) bauen.
- **Barrierefreiheit & UX:** Gute Lesbarkeit, schöne Fehlerbehandlung.

### 🧭 Person C – The Navigator (Map & Location)
*Du bringst den Nutzer zum Essen. Die Übersicht ist essenziell.*
- **Mensa Übersicht:** Liste und Karte implementieren.
- **Standort-Logik:** Nutzer-Position abfragen, "In der Nähe" Sortierung.
- **Filter-UI:** UI für Filter-Optionen (z.B. "Heute offen").

### 🧠 Person D – The Brain (AI Feature)
*Du machst die App "smart" und erfüllst die Innovations-Anforderung.*
- **KI-Feature:** Konzept & Umsetzung (z.B. Meal Matcher, Chatbot).
- **Integration:** Chat-Interface oder KI-Button einbauen.
- **Prompt Engineering:** Hilfreiche Antworten im Mensa-Kontext sicherstellen.

## 4. Gemeinsame Team-Aufgaben
- [ ] **GitHub Setup:** Repository WiSe25/26-Gruppe-01, .gitignore korrekt einstellen.
- [ ] **Code-Qualität:** Einheitliche Variablennamen und Ordnerstruktur.
- [ ] **Dokumentation:** README.md parallel zur Entwicklung pflegen.
- [ ] **Commits:** "Conventional Commits" nutzen (z.B. `feat:`, `fix:`).

---

## 🚀 Aktueller Entwicklungsstatus & Rollenanalyse (Stand: 27.12.2025)

### ⚙️ Person A: The Engine (API & Logik)
**Erledigt:**
- [x] **Mensa-API-Infrastruktur:** Axios-Instanz und Abruffunktionen in `services/mensaApi.ts` erstellt.
- [x] **Custom Hooks:** `hooks/useMensas.ts` und `hooks/useMeals.ts` für React Query Datenabruf implementiert.
- [x] **Utilities:** Basis für Datenmanagement (`utils/storage.ts`, `utils/network.ts`, `utils/queryKeys.ts`) geschaffen.

**Offen (To-Do):**
- [ ] **Erweiterte Filterung:** Logik für Allergene und vegetarische/vegane Optionen implementieren.
- [ ] **Offline-Caching:** Effiziente Synchronisierungsstrategie mit AsyncStorage entwickeln.
- [ ] **Benachrichtigungen:** Logik für Push-Nachrichten bei Lieblingsgerichten erstellen.

### 🎨 Person B: The Face (UI/UX)
**Erledigt:**
- [x] **Theme-System:** UniEats CI-Farbsystem in `constants/theme.ts` definiert.
- [x] **Kern-Komponenten:** `MensaCard.tsx` entwickelt (Design-Vorgaben eingehalten).
- [x] **Navigation:** Tab- und Stack-Navigation mit Expo Router eingerichtet.
- [x] **Map-Screen Layout:** UI-Design für `map.tsx` (Map-Container, Legende, Listen-Items) umgesetzt.

**Offen (To-Do):**
- [ ] **Detailansicht (Mensa Detail):** Dummy-View durch echtes UI ersetzen.
- [ ] **Account-Screen:** UI für Einstellungen und Präferenzen erstellen.
- [ ] **UX-Optimierung:** Skeleton-Loading und Übergangsanimationen hinzufügen.

### 🧭 Person C: The Navigator (Map & Location)
**Erledigt:**
- [x] **Karten-Gerüst:** Platzhalter und Layout in `map.tsx` vorbereitet.

**Offen (To-Do):**
- [ ] **Echte Karte:** Statisches Bild durch `react-native-maps` ersetzen.
- [ ] **Standort:** GPS-Berechtigungen und Echtzeit-Ortung implementieren.
- [ ] **Distanzberechnung:** `calculateDistance` Funktion implementieren (Zusammenarbeit mit Person A).
- [ ] **Interaktive Pins:** Klickbare Pins auf der Karte für Navigation zur Detailseite.

### 🧠 Person D: The Brain (AI Feature)
**Erledigt:**
- [x] **Screen-Basis:** `app/(tabs)/ai-chef.tsx` Datei angelegt.

**Offen (To-Do):**
- [ ] **AI-Service:** Anbindung an Gemini/OpenAI API für Essensempfehlungen.
- [ ] **Chat/Empfehlungs-UI:** Interface für die Interaktion mit dem "AI Chef" designen.
- [ ] **Prompt Engineering:** Optimierung der KI-Antworten basierend auf Mensa-Daten.