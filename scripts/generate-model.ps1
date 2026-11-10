Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 1400,720
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::White)
$ink = [System.Drawing.Brushes]::MidnightBlue
$body = [System.Drawing.Brushes]::Black
$title = New-Object System.Drawing.Font 'Segoe UI',24,([System.Drawing.FontStyle]::Bold)
$heading = New-Object System.Drawing.Font 'Segoe UI',18,([System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font 'Consolas',14
$small = New-Object System.Drawing.Font 'Segoe UI',12
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::SteelBlue),3
$g.DrawString('Tasklist v3 - Datenmodell', $title, $ink, 40, 25)
$g.FillRectangle([System.Drawing.Brushes]::AliceBlue, 50,110,460,370)
$g.DrawRectangle($pen,50,110,460,370)
$g.DrawString('User', $heading,$ink,70,125)
$g.DrawLine($pen,50,170,510,170)
$userFields = @('id           Int  PK','email        String  UNIQUE','password     String (scrypt)','profileImage String?','role         admin | user') -join [Environment]::NewLine
$g.DrawString($userFields, $font,$body,70,190)
$g.FillRectangle([System.Drawing.Brushes]::AliceBlue, 850,110,500,430)
$g.DrawRectangle($pen,850,110,500,430)
$g.DrawString('Task', $heading,$ink,870,125)
$g.DrawLine($pen,850,170,1350,170)
$taskFields = @('id           Int  PK','title        String','description  String','dueDate      Date','done         Boolean = false','creatorId    Int  FK -> User.id','assigneeId   Int? FK -> User.id') -join [Environment]::NewLine
$g.DrawString($taskFields, $font,$body,870,190)
$g.DrawLine($pen,510,240,850,240)
$g.DrawString('1', $heading,$ink,525,205)
$g.DrawString('0..n', $heading,$ink,780,205)
$g.FillRectangle([System.Drawing.Brushes]::White,580,218,175,42)
$g.DrawString('TaskCreator', $small,$ink,602,228)
$g.DrawLine($pen,510,370,850,370)
$g.DrawString('0..1', $heading,$ink,525,330)
$g.DrawString('0..n', $heading,$ink,780,330)
$g.FillRectangle([System.Drawing.Brushes]::White,580,348,175,42)
$g.DrawString('TaskAssignee', $small,$ink,597,358)
$notes = @('Jede Aufgabe hat genau einen Ersteller und optional einen zugewiesenen Benutzer.','Ein Benutzer kann beliebig viele Aufgaben erstellen und zugewiesen bekommen.','FK creatorId: ON DELETE RESTRICT | FK assigneeId: ON DELETE SET NULL') -join [Environment]::NewLine
$g.DrawString($notes, $small,$body,50,580)
$bitmap.Save((Join-Path (Get-Location) 'model.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bitmap.Dispose()
