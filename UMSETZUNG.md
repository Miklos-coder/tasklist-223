# Umsetzung und Abgabestand

Stand: 10. November 2026

## Tasklist v2 – Datenbankanbindung

| Anforderung | Ergebnis |
| --- | --- |
| Prisma mit MySQL-Datenquelle initialisieren | Erfüllt, Client generiert |
| Task mit id, title, description, dueDate, done | Erfüllt |
| Migration für Aufgabentabelle | Erstellt und ausgeführt |
| Aufgaben aus Datenbank lesen | Erfüllt |
| Offene zuerst, dann Datum aufsteigend | Erfüllt und getestet |
| Leere Liste anzeigen | Erfüllt und im v2-Test geprüft |
| Aufgaben persistent speichern, nachher Weiterleitung | Erfüllt und getestet |
| Aufgaben persistent erledigen und löschen | Erfüllt und getestet |
| Verständliche Fehler bei Datenbankproblemen | Erfüllt, alle Datenbankrouten getestet |
| npm start und node_modules ignorieren | Erfüllt |
| Commits pro Arbeitsschritt | Lokal erstellt |

Die vorhandenen EJS-Seiten wurden für die v2-Datenbankumstellung zunächst beibehalten. Die anschliessenden v3-Erweiterungen benötigen zusätzliche Seiten und Spalten für Benutzer und Zuweisungen.

## Tasklist v3 – Benutzer und Aufgaben-Zuweisung

| Anforderung | Ergebnis |
| --- | --- |
| Drei Prisma-Konzepte erklären | In responses-transactions.md ausgearbeitet |
| Benutzer mit E-Mail, Passwort, optionalem Profilbild und Rolle | Erfüllt |
| Ersteller und optionale Zuweisung bei Aufgaben | Erfüllt |
| Datenmodellskizze model.png | Erstellt und visuell geprüft |
| Migration mit vorhandenen v2-Aufgaben | Erstellt, ausgeführt und mit einer bestehenden Testaufgabe geprüft |
| Gemeinsamer Benutzerservice mit Passwort-Hashing | Erfüllt, scrypt mit zufälligem Salt |
| Admin-Seed in prisma/seed.js und package.json | Erfüllt |
| npx prisma db seed ausführen und Admin prüfen | Ausgeführt, Admin auch nach Datenbankneustart vorhanden |
| Registrierung mit Weiterleitung | Erfüllt |
| Automatische Aufgabe «Profilbild hochladen» | Erfüllt; dem neuen Benutzer zugewiesen, innerhalb von zwei Tagen fällig |
| Benutzer und Aufgabe gemeinsam speichern | Erfüllt; echter Rollback bei erzwungenem Aufgabenfehler getestet |
| Doppelte E-Mail verständlich behandeln | Erfüllt, auch bei anderer Gross-/Kleinschreibung |
| Benutzerübersicht und persistente Rollenänderung | Erfüllt |
| Zuweisen, Neuzuweisen und Zuweisung entfernen | Erfüllt |
| Admin als Ersteller, unabhängig von Zuweisung | Erfüllt, einschliesslich automatisch angelegter Aufgaben |
| Nachvollziehbare Commits | Lokal erstellt |

## Validierung

- Sechs Integrationstests bestanden, mit eigener echter Datenbank tasklist_test.
- Aufgaben-CRUD, Sortierung, separate Datenbankverbindung, Passwort-Hash und wiederholter Seed geprüft.
- Registrierung, doppelte E-Mails, ungültige Eingaben und Transaktions-Rollback geprüft.
- Rollenänderungen sowie Zuweisung, Neuzuweisung und Entfernen einer Zuweisung geprüft.
- Verständliche Fehler bei nicht erreichbarer Datenbank auf allen Datenbankrouten geprüft.
- V2-Aufgabe erfolgreich durch die v3-Migration übernommen und danach als Testdatensatz entfernt.
- Lokale Datenbank sauber beendet und neu gestartet; Admin blieb gespeichert.
- Start über npm start geprüft; Aufgabenliste, Formular, Registrierung und Benutzerübersicht liefern HTTP 200.
- Prisma-Schema validiert, beide Migrationen angewendet.
- npm audit: keine bekannten Sicherheitslücken.
- git diff --check ohne Fehler.

Die Datenquelle ist als MySQL konfiguriert. Die Laufzeittests wurden mit der lokal vorhandenen, MySQL-kompatiblen MariaDB 10.4.32 durchgeführt, nicht mit einem separaten Oracle-MySQL-Server.

## Lokal bereit

Die Anwendung läuft unter http://localhost:3001, weil Port 3000 schon von einer anderen Anwendung genutzt wird. Der lokale Admin heisst admin@tasklist.local. Sein zufälliges Passwort steht ausschliesslich in der ignorierten .env; die Datenbank speichert nur den Hash.

Die Anwendung enthält absichtlich keine Testaufgaben oder Testbenutzer. Der Admin-Seed ist vorhanden. Eigene Aufgaben und Benutzer können über die Oberfläche angelegt werden.

## Offen und Grenzen

Keine angeforderte Programmfunktion musste wegen einer fehlenden Fähigkeit ausgelassen werden.

- Die Änderungen sind lokal committed; ein Push und die Abgabe auf der Schulplattform wurden nicht durchgeführt.
- Die drei Konzepte sind erklärt. Welche davon dir persönlich zuvor unbekannt waren, musst du selbst prüfen; deinen bisherigen Wissensstand kann ich nicht feststellen.
- Ein tatsächlicher Profilbild-Upload und ein Login sind nicht Bestandteil der beiden Aufgaben. Das optionale Feld und die Profilbild-Aufgabe sind umgesetzt.
- Die Bewertung durch die Lehrperson kann ich nicht garantieren.

Start- und Einrichtungsanleitung: README.md.
