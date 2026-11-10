# Prisma-Beziehungen und Transaktionen

## 1. Relationsfeld und Fremdschlüssel sind verschieden

Bei einer Aufgabe ist `creatorId` die tatsächlich gespeicherte Zahl in der Datenbank. Das Relationsfeld `creator` ermöglicht dagegen den Zugriff auf das passende Benutzerobjekt über Prisma. Auf der Gegenseite liefert `createdTasks` die Aufgaben des Benutzers. Diese Liste ist keine zusätzliche Datenbankspalte: Die Zuordnung ergibt sich aus den Fremdschlüsseln der Aufgaben.

## 2. Zwei Beziehungen zwischen denselben Modellen brauchen Namen

Eine Aufgabe hat einen Ersteller und kann einem anderen Benutzer zugewiesen sein. Beide Beziehungen verbinden `Task` mit `User`. Deshalb heissen sie im Schema ausdrücklich `TaskCreator` und `TaskAssignee`. Derselbe Beziehungsname steht jeweils auf beiden Seiten. So erkennt Prisma, dass `createdTasks` zum Ersteller gehört und `assignedTasks` zur Zuweisung.

## 3. Optionale Beziehungen bestimmen auch das Löschverhalten

`assigneeId Int?` und `assignee User?` erlauben Aufgaben ohne Zuweisung. `null` bedeutet dabei «niemandem zugewiesen». Mit `onDelete: SetNull` würde beim Löschen eines zugewiesenen Benutzers die Aufgabe erhalten bleiben und ihre Zuweisung verlieren. Der Ersteller ist dagegen verpflichtend. `onDelete: Restrict` verhindert das Löschen eines Benutzers, solange Aufgaben auf ihn als Ersteller verweisen.

## Anwendung einer Transaktion bei der Registrierung

Benutzer und Profilbild-Aufgabe gehören zu einem gemeinsamen Vorgang. In `registerUser` laufen beide Inserts über denselben Transaktionsclient `tx`. Erst wenn beide gelingen, wird gespeichert. Schlägt das Anlegen der Aufgabe fehl, wird auch der vorher angelegte Benutzer zurückgerollt. Eine doppelte E-Mail-Adresse verhindert bereits das Anlegen des Benutzers und damit auch seiner Aufgabe.

Der Integrationstest erzwingt einen Datenbankfehler beim Aufgaben-Insert und kontrolliert anschliessend, dass weder ein neuer Benutzer noch eine zusätzliche Aufgabe übrigbleibt.

## Quellen

- [Prisma: Relations](https://www.prisma.io/docs/orm/v6/prisma-schema/data-model/relations)
- [Prisma: Transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)
