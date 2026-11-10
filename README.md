# Tasklist v2 und v3

Express-/EJS-Anwendung mit Prisma und einer MySQL-kompatiblen Datenbank.

## Lokal starten (Windows mit vorhandenem XAMPP)

Voraussetzungen: Node.js 24, npm und XAMPP/MariaDB unter `C:/xampp/mysql`. Ein anderer Installationspfad kann über `MYSQL_HOME` gesetzt werden.

```powershell
npm.cmd ci
npm.cmd run db:local:start
npm.cmd run db:generate
npm.cmd run db:migrate
npx.cmd prisma db seed
npm.cmd start
```

Danach: http://localhost:3000 (oder der in `PORT` konfigurierte Port).

In dieser Arbeitsumgebung ist Port 3000 bereits durch eine andere Anwendung belegt. Die lokale `.env` verwendet deshalb `PORT=3001`: http://localhost:3001.

`db:local:start` legt eine eigene Datenbankinstanz unter `.local/mysql` an und bindet sie ausschliesslich an `127.0.0.1:3307`. Die bestehenden XAMPP-Daten unter `C:/xampp/mysql/data` werden nicht verwendet. Die Daten bleiben nach einem App-Neustart erhalten. Beenden: `npm.cmd run db:local:stop`.

Wenn noch keine `.env` existiert, erzeugt das lokale Setup zufällige Datenbank- und Admin-Passwörter. Eine bereits bestehende `.env` wird beibehalten. Die lokale `.env` und Datenbankdateien werden nicht eingecheckt.

In Windows PowerShell vermeidet `npm.cmd` Probleme mit gesperrten PowerShell-Skripten. In anderen Shells genügt `npm`.

## Eigene MySQL-Datenbank verwenden

1. `.env.example` nach `.env` kopieren.
2. `DATABASE_URL` auf die eigene MySQL-Datenbank setzen.
3. `ADMIN_EMAIL` und ein eigenes `ADMIN_PASSWORD` mit 12–256 Zeichen setzen.
4. `npm run db:generate`, `npm run db:migrate` und `npx prisma db seed` ausführen.
5. `npm start` ausführen.

Für Tests zusätzlich eine getrennte Datenbank bereitstellen und `TEST_DATABASE_URL` konfigurieren. Ihr Name muss auf `_test` enden und sich von der Anwendungsdatenbank unterscheiden.

## Funktionen

- Aufgaben persistent anlegen, anzeigen, erledigen und löschen.
- Sortierung: offene Aufgaben zuerst, danach Fälligkeitsdatum aufsteigend.
- Verständliche Fehlerseiten bei fehlender Datenbank und ungültigen Eingaben.
- Registrierung unter `/registrieren`, eindeutige E-Mail-Adressen und gesalzene scrypt-Passwort-Hashes.
- Registrierung und die Aufgabe «Profilbild hochladen» werden atomar gespeichert; Zuweisung an den neuen Benutzer, Fälligkeit innerhalb von zwei Tagen.
- Benutzerübersicht unter `/benutzer` mit persistenter Rollenänderung zwischen `admin` und `user`.
- Zuweisung, Neuzuweisung und Aufheben einer Zuweisung direkt in der Aufgabenliste.
- Neue Aufgaben haben einen Admin als Ersteller. Manuell erfasste Aufgaben sind zunächst unzugewiesen.
- Optionales Profilbild im Datenmodell. Die geforderte Profilbild-Aufgabe wird angelegt; ein tatsächlicher Datei-Upload und ein Login gehören nicht zum Aufgabenumfang.

Es gibt gemäss Aufgabenstellung noch keinen Login und damit keine Zugriffsbeschränkung für Rollenänderungen. Dies ist eine lokale Übungsanwendung. Wird der konfigurierte Admin zu einem normalen Benutzer geändert, wird ein anderer vorhandener Admin als Ersteller verwendet. Gibt es keinen Admin mehr, zeigt die Anwendung einen Hinweis auf den erneut auszuführenden Seed.

## Migrationen

1. `20261110000100_create_tasks`: v2-Aufgabentabelle.
2. `20261110000200_add_users`: Benutzer und Beziehungen.

Die zweite Migration fügt `creatorId` zunächst optional hinzu, ordnet vorhandene Aufgaben einem technischen Admin zu und macht das Feld erst danach verpflichtend. Bestehende Aufgaben, Status und Fälligkeiten werden nicht gelöscht. Die Zuweisung bleibt leer. Der technische Admin verwendet `admin@tasklist.local` und einen zufälligen, nicht im Klartext gespeicherten Passwortwert. Der Seed setzt für die konfigurierte Admin-Adresse den Hash aus `ADMIN_PASSWORD` und ist wiederholt ausführbar. Bei abweichender Admin-Adresse bleibt der technische Ersteller historischer Aufgaben erhalten.

Die Migrationen erwarten eine v1-Ausgangslage ohne Tabellen oder eine v2-Datenbank, die bereits die erste Migration enthält. Eine fremde Datenbank mit vorhandenen Tabellen ohne Prisma-Migrationshistorie muss vorab korrekt baselined werden; niemals durch einen Reset vorhandene Daten löschen.

## Prüfungen

```powershell
npm.cmd test
npx.cmd prisma validate
npx.cmd prisma migrate status
npm.cmd audit
```

Die sechs Integrationstests verwenden eine separate echte Datenbank und prüfen unter anderem CRUD, Sortierung, erneute Datenbankverbindung, Seed, Passwort-Hash, Registrierung, Duplikate, einen erzwungenen Transaktions-Rollback, Rollen, Zuweisungen und Fehler bei nicht erreichbarer Datenbank. Der Testbenutzer benötigt zusätzlich Rechte zum Anlegen und Entfernen eines Test-Triggers. Testdaten werden wieder entfernt.

`model.png` zeigt das Datenmodell. Die drei erläuterten Prisma-Konzepte stehen in `responses-transactions.md`.

## Repository für die Abgabe

https://github.com/Miklos-coder/tasklist-223

Die Änderungen sind lokal in Arbeitsschritten versioniert. Ein Push oder eine Abgabe auf einer Schulplattform wird nicht automatisch ausgeführt.
