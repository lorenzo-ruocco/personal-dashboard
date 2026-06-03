# Personal Dashboard

Lokales Dashboard mit Wetter, Aktienindizes, Todo-Liste, Sticky Notes und Linksammlung.

## Ein-Server-Betrieb

Das React-Frontend wird als statische Dateien in Spring Boot eingebettet. Im Alltag muss danach nur noch das Backend laufen.

Frontend nach Aenderungen bauen:

```cmd
cd /d <projektordner>\frontend
npm run build
```

Dadurch werden die Dateien nach `<projektordner>\backend\src\main\resources\static` geschrieben.

Backend starten:

```cmd
cd /d <projektordner>\backend
mvnw.cmd spring-boot:run
```

Oder aus dem Projektordner:

```cmd
start-dashboard.bat
```

Danach im Browser oeffnen:

```text
http://localhost:8080/
```

## Automatisch Starten

Damit das Dashboard nach der Windows-Anmeldung automatisch laeuft, kann `start-dashboard.bat` in der Windows Aufgabenplanung als Aufgabe beim Anmelden gestartet werden.

Empfohlene Einstellung:

- Programm/Skript: `<projektordner>\start-dashboard.bat`
- Starten in: `<projektordner>`
- Trigger: Bei Anmeldung

## Entwicklung

Wenn du am Frontend entwickelst und Hot Reload willst, kannst du weiterhin zwei Server starten.

Backend:

```cmd
cd /d <projektordner>\backend
mvnw.cmd spring-boot:run
```

Frontend:

```cmd
cd /d <projektordner>\frontend
npm run dev
```

Entwicklungsadresse:

```text
http://localhost:5173/
```

## Ports

- Frontend Entwicklung: `5173`
- Backend: `8080`

Wenn das Backend mit `Port 8080 was already in use` fehlschlaegt, laeuft bereits ein Java-Prozess auf diesem Port.

PID finden:

```cmd
netstat -ano | findstr :8080
```

Prozess stoppen:

```cmd
taskkill /PID <PID> /F
```

## Lokale Daten

Die persistenten Daten liegen in der H2-Datenbank unter:

```text
<projektordner>\backend\data
```

Darin stecken unter anderem Aufgaben, Sticky Notes, Link-Kategorien und Link-Kacheln. Fuer ein Backup den ganzen Ordner `backend\data` kopieren, waehrend das Backend gestoppt ist.

## Linksammlung

Webseiten werden direkt im Browser geoeffnet und bekommen ein Favicon.

Lokale Ziele werden ueber das Backend geoeffnet. Unterstuetzt sind zum Beispiel:

```text
C:\Users\<name>\Downloads
C:\Users\<name>\OneDrive\Desktop\Programm.lnk
C:\Program Files\App\App.exe
```

Wenn lokale Ziele nicht funktionieren:

1. Backend neu starten, damit `/api/open-target` aktiv ist.
2. Pfad erneut aus dem Explorer kopieren.
3. Pruefen, ob die Datei, der Ordner oder die Verknuepfung wirklich existiert.
