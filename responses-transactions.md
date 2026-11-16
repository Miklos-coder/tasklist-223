# Prisma-Beziehungen und Transaktionen

Für unsere Tasklist habe ich mich mit den Beziehungen in Prisma beschäftigt. Dabei habe ich drei Konzepte kennengelernt, die für die Verbindung zwischen Benutzern und Aufgaben wichtig sind.

**Relationsfeld und Fremdschlüssel**

Bei einer Beziehung in Prisma gibt es einen Unterschied zwischen dem **Relationsfeld** und dem **Fremdschlüssel**. Der Fremdschlüssel speichert die ID des verbundenen Datensatzes in der Datenbank. Das Relationsfeld wird hingegen verwendet, um über Prisma auf den verbundenen Datensatz zuzugreifen.

In unserer Tasklist speichert zum Beispiel `creatorId` die ID des Benutzers, der eine Aufgabe erstellt hat. Über das Relationsfeld `creator` können wir auf den dazugehörigen Benutzer zugreifen. Beim Benutzer gibt es zusätzlich `createdTasks`. Darüber können wir seine erstellten Aufgaben abrufen. Diese Liste wird nicht als eigene Spalte in der Datenbank gespeichert, sondern ergibt sich aus den Fremdschlüsseln der Aufgaben.

**Mehrere Beziehungen zwischen denselben Modellen**

In unserer Anwendung gibt es zwei Beziehungen zwischen einer Aufgabe und einem Benutzer. Eine Aufgabe hat einen **Ersteller** und kann zusätzlich einem Benutzer **zugewiesen** werden. Der Ersteller und der zugewiesene Benutzer müssen dabei nicht dieselbe Person sein.

Damit Prisma diese beiden Beziehungen unterscheiden kann, haben wir ihnen Namen gegeben. Die Beziehung für den Ersteller heisst `TaskCreator` und die Beziehung für die Zuweisung `TaskAssignee`. Auf beiden Seiten der jeweiligen Beziehung wird derselbe Name verwendet. Dadurch erkennt Prisma, welche Felder zusammengehören.

**Optionale Beziehungen und Löschverhalten**

Eine Beziehung kann auch optional sein. In unserer Tasklist muss eine Aufgabe nicht zwingend einem Benutzer zugewiesen sein. Deshalb sind `assigneeId` und `assignee` im Prisma-Schema optional. Wenn die Zuweisung leer ist, wird dafür `null` gespeichert.

Zusätzlich haben wir festgelegt, was beim Löschen eines Benutzers passieren soll. Bei einer Zuweisung sorgt `onDelete: SetNull` dafür, dass die Aufgabe erhalten bleibt und nur die Zuweisung entfernt wird. Der Ersteller einer Aufgabe ist hingegen verpflichtend. Mit `onDelete: Restrict` wird verhindert, dass ein Benutzer gelöscht wird, solange er als Ersteller einer Aufgabe eingetragen ist.

**Transaktion bei der Registrierung**

Bei der Registrierung sollen der neue Benutzer und die Aufgabe **«Profilbild hochladen»** zusammen gespeichert werden. Dafür verwenden wir eine Transaktion. Beide Datenbankoperationen werden über denselben Transaktionsclient `tx` ausgeführt.

Dadurch werden die Änderungen nur übernommen, wenn beide Vorgänge erfolgreich sind. Falls das Erstellen der Aufgabe fehlschlägt, wird auch das Erstellen des Benutzers zurückgerollt. Bei einer bereits verwendeten E-Mail-Adresse wird ebenfalls keine neue Aufgabe angelegt.

Wir haben diesen Fall mit einem Integrationstest geprüft. Dabei wird absichtlich ein Fehler beim Speichern der Aufgabe ausgelöst. Anschliessend wird kontrolliert, dass weder ein neuer Benutzer noch eine zusätzliche Aufgabe gespeichert wurde.

**Quellen**

- [Prisma: Relations](https://www.prisma.io/docs/orm/v6/prisma-schema/data-model/relations)
- [Prisma: Transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)
