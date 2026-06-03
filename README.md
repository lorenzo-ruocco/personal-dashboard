# Personal Dashboard

Lokales Dashboard mit Wetter, Aktienindizes, Todo-Liste, Sticky Notes und Linksammlung.

## Starten

Backend in einem CMD-Fenster starten:

```cmd
cd /d <projektordner>\backend
mvnw.cmd spring-boot:run
```

Frontend in einem zweiten CMD-Fenster starten:

```cmd
cd /d <projektordner>\frontend
npm run dev
```

Danach im Browser oeffnen:

```text
http://localhost:5173/
```

## Ports

- Frontend: `5173`
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
