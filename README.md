# LinkUp – Tandem-Programm für internationale Studierende

LinkUp ist eine webbasierte Matching-Plattform, die internationale Studierende mit deutschsprachigen Studierenden oder Personen mit sehr guten Deutschkenntnissen verbindet.

Das Ziel der Anwendung ist es, das Deutschlernen durch regelmäßige Gespräche zu fördern, neue Kontakte zu ermöglichen und die Integration internationaler Studierender zu unterstützen.

---

## Funktionen

### Benutzerkonto

* Registrierung
* Anmeldung
* Abmeldung
* Konto löschen

### Profilverwaltung

* Profil erstellen
* Profil bearbeiten
* Profilbild hochladen
* Profilbild löschen

### Matching

* Andere Profile entdecken
* Interesse an Profilen zeigen
* Profile überspringen
* Automatische Erkennung gegenseitiger Matches

### Kontakte

* Anzeige aller Matches
* Anzeige von Kontaktinformationen
* Verwaltung bestehender Tandem-Partnerschaften

---

## Verwendete Technologien

### Frontend

* React
* TypeScript
* HTML
* CSS

### Backend

* ASP.NET Core
* .NET 8
* C#

### Datenbank

* Entity Framework Core
* SQL-Datenbank

### Entwicklungstools

* GitHub
* Rider
* WebStorm


---

## Installation

### 1.1 Ziel der Anleitung

Diese Anleitung beschreibt, wie LinkUp lokal installiert und gestartet werden kann.

Frontend: React-Anwendung
Backend: .NET Web API

Das Frontend kommuniziert über HTTP mit dem Backend.

### 1.2 Voraussetzungen

Für die lokale Ausführung werden folgende Programme benötigt:

* Git
* Node.js
* npm
* .NET SDK 8
* Ein aktueller Browser, z.B. Chrome, Edge oder Safari
* Eine Entwicklungsumgebung wie WebStorm, Rider oder Visual Studio Code

### 1.3 Projekt herunterladen

Das Projekt muss zunächst auf den eigenen Rechner kopiert werden.

```bash
git clone <repository-url>
cd LinkUp
```

Falls das Projekt als ZIP-Datei vorliegt, muss die ZIP-Datei entpackt und anschließend der Projektordner geöffnet werden.

Die Projektstruktur sieht vereinfacht so aus:

```text
LinkUp/
  apps/
    react/    Frontend
    dotnet/   Backend
```

### 1.4 Backend starten

Zuerst wird das Backend gestartet.

Im Terminal in den Backend-Ordner wechseln:

```bash
cd apps/dotnet
```

Backend starten:

```bash
dotnet run --project ./Api/LinkUp.Api.csproj
```

Das Backend läuft anschließend lokal, z. B. unter:

```text
http://localhost:8083
```

Falls ein JWT Secret Key benötigt wird, muss dieser vorher als Umgebungsvariable gesetzt werden.

Key:

```text
d7b282ef-762e-4f0a-9e76-9ad76d576c45
```

### 1.5 Frontend starten

Ein zweites Terminal öffnen und in den Frontend-Ordner wechseln:

```bash
cd apps/react
```

Abhängigkeiten installieren:

```bash
npm install
```

Frontend starten:

```bash
npm run dev
```

Das Frontend wird über Vite gestartet. Die URL wird im Terminal angezeigt, z. B.:

```text
http://localhost:5173
```

Diese Adresse wird anschließend im Browser geöffnet.

### 1.6 Verbindung zwischen Frontend und Backend

Frontend und Backend müssen gleichzeitig laufen.

Das Frontend leitet API-Anfragen automatisch an das Backend weiter. Dafür ist in der Datei `vite.config.js` ein Proxy eingerichtet.

### 1.7 Kurzfassung

Backend:

```bash
cd apps/dotnet
dotnet run --project ./Api/LinkUp.Api.csproj
```

Frontend:

```bash
cd apps/react
npm install
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:5173
```

### 1.8 Server-Version

Alternativ zur lokalen Ausführung kann die Anwendung über die bereitgestellte Server-Version genutzt werden.

Die Anwendung ist erreichbar unter:

```text
http://linkup.cs.ovgu.de
```



---

## Projektteam

| Teammitglied    | Aufgabe              |
| --------------- | -------------------- |
| Mohammad Zaidan | Backend-Entwicklung  |
| Ahmad Hijazi    | Frontend-Entwicklung |
| Safa Jahjah     | Dokumentation und Design      |
| Lana Alkurdi    | Dokumentation und Design      |

---

## Ziel des Projekts

LinkUp wurde im Rahmen eines Softwareprojekts entwickelt, um internationale Studierende beim Erlernen der deutschen Sprache zu unterstützen und den Austausch zwischen Studierenden verschiedener Kulturen zu fördern.

Durch die Vermittlung passender Tandem-Partner ermöglicht die Anwendung regelmäßige Gespräche, neue Freundschaften und eine bessere Integration in das universitäre Umfeld.

---


## Lizenz

Dieses Projekt wurde im Rahmen des Moduls **Softwareprojekt** an der Otto-von-Guericke-Universität Magdeburg entwickelt und dient ausschließlich Lehr- und Demonstrationszwecken.

