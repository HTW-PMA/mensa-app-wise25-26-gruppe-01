## 2. 📝 Technische Implementierung To-Do List

- Funktionale Anforderungen
- [ ]  App-Identität: Die App besitzt einen individuellen Namen und ein passendes Icon, das zum Thema zur Zielgruppe passt → Die App soll einen wiedererkennbaren Charakter haben.
- [ ]  Übersicht und Navigation: Es gibt eine übersichtliche Darstellung der verfügbaren Mensen → Nutzer:innen können sich leicht orientieren und gewünschte Informationen finden. (Grundbausteine einer App, Mensa API)
- [ ]  Speiseinformationen: Nutzer:innen können die angebotenen Speisen und Preise in einer verständlichen, aktuellen und informativen Darstellung einsehen. → So erhalten sie transparente Informationen und können fundierte Entscheidung treffen, wo und was sie essen möchten (Grundbausteine einer App, Mensa API)
- [ ]  Personalisierung: Einstellungen oder Präferenzen (z.B. Lieblingsmensa oder Lieblingsspeisen) können gespeichert werden. → Dadurch wird die App persönlicher und spart den Nutzer:innen Zeit bei wiederholter Nutzung
- [ ]  Zusatzinformationen: Hinweise zu Inhaltsstoffen oder Allergenen sind verfügbar → Die App hilft Nuzer:innen, informierte Entscheidungen zu treffen.
- [ ]  Künstliche Intelligenz: Ein KI-basiertes Feature erweitert die App um ein modernes, intelligentes Element. → So entsteht ein zusätzlicher Nutzen für die Nutzer:innen und die App hebt sich durch innovative Funktionalität von klassischen Anwendungen ab. (KI in der App)
- [ ]  Benachrichtigungen oder Erinnerungen: Die App kann Nutzer:innen aktiv informieren oder erinnern. → Ziel ist, die App nützlicher im Alltag zu machen.
- Qualitätsanforderungen
- [ ]  Code-Struktur und Wiederverwendung: Der Code ist logisch aufgebaut, gut lesbar und fördert Wiederverwendung durch klar gegliederte Module,  Komponenten oder Funktionen. → So bleibt das Projekt übersichtlich, leichter wartbar und kann bei zukünftigen Entwicklungen effizient erweitert werden. (Funktionale Komponenten, Hooks)
- [ ]  Zustands- und Logikverwaltung: Zustände und Datenflüsse sind konsistent und klar nachvollziehbar → Die App verhält sich zuverlässig bei Nutzerinteraktionen (State Management)
- [ ]  Offline-Fähigkeit: Die App funktioniert in Grundzügen auch ohne Internet (durch lokale Speicherung). →  Sie bleibt benutzbar, auch wenn externe Dienste ausfallen. (Datenspeicherung)
- [ ]  Fehlerbehandlung und Stabilität: Die App reagiert robust auf Probleme und zeigt verständliche Fehlermeldungen. →  Sie bleibt funktionsfähig oder informiert den Nutzer angemessen
- [ ]  Versionshistorie: Commits sind sinnvoll getrennt und mit aussagekräftigen Nachrichten versehen (z.B. “Implementiere Speichern der Lieblingsmensa” gemäß Linus-Torvalds-Konvention). → Der Fortschritt ist klar dokumentiert, und Änderungen lassen sich gezielt nachverfolgen.
- [ ]  Dokumentation: Eine kurze, verständliche Dokumentation (z.B. README-Datei) beschreibt Installation, Nutzung und besondere Hinweise zur App →  Dadurch können wir das Projekt leichter testen.
- [ ]  Benennung und Lesbarkeit: Variablen, Komponenten und Funktionen sind klar benannt und folgen einem konsistenten Stil. →  Der Code ist auch für Dritte leicht verständlich
- [ ]  Sicherheitsaspekte: Sensible Daten wie API-Keys oder Tokens sind sicher eingebunden und dürfen nicht öffentlich (in GitHub) einsehbar sein. →  So werden vertrauliche Informationen geschützt und Sicherheitsrisiken im Projekt vermeiden.
- Technische Hinweise
- [ ]  Implementierung und Quellcode: Der vollständige Quellcode muss im jeweiligen Gruppen-Repository auf GitHub hochgeladen werden. Nutzt dazu den GitHub Classroom-Link in Moodle. Namensschema für das Repository: WiSe25/26-Gruppe-01
- [ ]  Mensa-API: Ein zentrales Element euerer App ist der Zugriff auf alle Berliner Mensen und ihre aktuellen Speisepläne - diese werden über eine bestehende API eines ehemaligen Kursteilnehmers bereitgestellt.

  API-Endpunkt: [https://mensa.gregorﬂachs.de/](https://mensa.xn--gregorachs-l498c.de/)

  Um die API nutzen zu können, müsst ihr euch einen API-Key generieren. Eine Schritt-für-Schritt-Anleitung und alle technischen Details findet ihr in der zugehörigen Swagger-Dokumentation: [https://mensa.gregorﬂachs.de/swaggerdoku](https://mensa.xn--gregorachs-l498c.de/swaggerdoku)

- [ ]  Hinweise zum Plagiat und zur Eigenständigkeit

  Der Im jeweiligen GitHub-Repository abgelegte Quellcode muss vollständig von der jeweiligen Gruppe selbstständig entwickelt worden sein.

    1. Zusammenarbeit zwischen Gruppen ist nicht erlaubt.
    2. Die Übernahme von Quellcode oder Code-Fragmenten anderer Gruppen - auch aus vergangenen Semestern - ist streng untersagt.

  Wichtig: Ein Plagiatsversuch - auch bei nur einem Teil des Projekts - führt zur Bewertung der gesamten Veranstaltung mit “nicht ausreichend” (5,0) oder “ohne Erfolg” (o.E.).

  ### 🚀 Aufgabenverteilung für das Kanban-Board

  👤 Person A – The Engine (API, Data, State)

  *Du bist das Herzstück der App. Ohne dich ist die App nur eine hübsche Hülle ohne Inhalt.*

    - **Mensa-API Anbindung:**
        - API-Key generieren (siehe Swagger-Doku) und sicher einbinden (Achtung: .env Datei nutzen, Key **nicht** auf GitHub pushen! → *Sicherheitsaspekte*).
        - Abruf der Speisepläne und Mensen programmieren (fetch oder axios).
    - **Zustands- & Logikverwaltung (State Management):**
        - Globalen State aufsetzen (z.B. mit React Context oder Zustand), damit Daten überall verfügbar sind.
        - Logik schreiben, um Daten zu filtern (z.B. Allergene ausfiltern → *Zusatzinformationen*).
    - **Offline-Fähigkeit & Persistenz:**
        - Implementierung von AsyncStorage (oder ähnlichem), um Speisepläne lokal zu cachen, damit die App auch im Flugmodus was anzeigt.
        - Speichern der User-Einstellungen (z.B. "Lieblingsmensa").
    - **Benachrichtigungen:**
        - Logik für lokale Push-Notifications (z.B. "Dein Lieblingsessen gibt es heute").

  👤 Person B – The Face (UI & Screens)

  *Du sorgst dafür, dass die App sich anfühlt wie "UniEats" – grün, modern, clean.*

    - **App-Identität & Styling:**
        - Einrichten des Theme-Systems (Farben: #02AA20 Grün, Schwarz, Inter-Schriftart gemäß eurem Design-Manual).
        - App Icon und Splash Screen einbinden.
    - **Navigation & Struktur:**
        - Routing aufsetzen (z.B. React Navigation mit Bottom Tabs und Stacks).
        - Erstellen der Screens: Detailansicht für Gerichte, Einstellungs-Screen.
    - **Komponenten-Bau:**
        - Wiederverwendbare UI-Komponenten bauen (z.B. DishCard, PriceTag, Header).
        - Sicherstellen, dass Fehler (z.B. "Kein Internet") hübsch angezeigt werden (UI für *Fehlerbehandlung*).
    - **Barrierefreiheit & UX:**
        - Darstellung der Allergene und Preise (übersichtlich!).

  👤 Person C – The Navigator (Map & Location)

  *Du bringst den Nutzer zum Essen. Da "Übersicht der Mensen" eine Kernanforderung ist, ist dein Part essenziell.*

    - **Mensa Übersicht (List & Map):**
        - Implementierung der Hauptliste aller Mensen.
        - Einbindung einer Karte (z.B. react-native-maps), die die Mensen als Pins zeigt.
    - **Standort-Logik:**
        - Abfrage der Nutzer-Position (Permissions beachten!).
        - Sortier-Funktion: "Zeige Mensen in meiner Nähe zuerst".
    - **Filter-UI:**
        - Zusammen mit Person A: UI-Logik für Filter (z.B. "Nur Mensen, die heute offen haben").

  👤 Person D – The Brain (AI Feature)

  *Du machst die App "smart" und erfüllst die Innovations-Anforderung.*

    - **KI-Feature Konzeption & Umsetzung:**
        - Was genau macht die KI? (Idee: Ein "Meal Matcher", der basierend auf Stimmung oder Zutaten ein Gericht vorschlägt, oder ein Chatbot, der Fragen zu Inhaltsstoffen beantwortet).
        - Anbindung einer KI-API (z.B. OpenAI) oder Nutzung lokaler Modelle (falls möglich/sinnvoll).
    - **Integration:**
        - Einbau des KI-Buttons oder Chat-Interfaces in die App.
        - Prompt Engineering: Sicherstellen, dass die KI hilfreiche Antworten im Kontext von Mensa-Essen gibt.

  🤝 Gemeinsame To-Dos (Team-Aufgaben)

    1. **GitHub Setup (Sofort erledigen):**
        - Repository erstellen mit Namen WiSe25/26-Gruppe-01.
        - .gitignore korrekt einstellen (damit keine node_modules oder API-Keys hochgeladen werden).
    2. **Code-Qualität:**
        - Einigt euch auf Variablennamen (Englisch oder Deutsch) und Ordnerstruktur (/components, /screens, /hooks).
    3. **Dokumentation:**
        - Schreibt an der README.md parallel zur Entwicklung mit, nicht erst am Ende! (Installationsanleitung, Features).
    4. **Commits:**
        - Nutzt "Conventional Commits" (z.B. feat: add map view, fix: crash on android), wie in den Anforderungen gewünscht.