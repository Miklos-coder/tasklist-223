Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 1400, 510
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::White)
$ink = [System.Drawing.Brushes]::Black
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 2
$heading = New-Object System.Drawing.Font 'Arial', 18, ([System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font 'Consolas', 14
$label = New-Object System.Drawing.Font 'Arial', 13

$g.DrawRectangle($pen, 50, 60, 430, 350)
$g.DrawString('User', $heading, $ink, 70, 73)
$g.DrawLine($pen, 50, 115, 480, 115)
$userFields = @('id            Int     PK', 'email         String  UNIQUE', 'password      String', 'profileImage  String?', 'role          admin | user') -join [Environment]::NewLine
$g.DrawString($userFields, $font, $ink, 70, 135)

$g.DrawRectangle($pen, 900, 60, 450, 350)
$g.DrawString('Task', $heading, $ink, 920, 73)
$g.DrawLine($pen, 900, 115, 1350, 115)
$taskFields = @('id           Int      PK', 'title        String', 'description  String', 'dueDate      DateTime', 'done         Boolean  default false', 'creatorId    Int      FK', 'assigneeId   Int?     FK') -join [Environment]::NewLine
$g.DrawString($taskFields, $font, $ink, 920, 135)

$g.DrawLine($pen, 480, 200, 900, 200)
$g.FillRectangle([System.Drawing.Brushes]::White, 628, 187, 124, 27)
$g.DrawString('TaskCreator', $label, $ink, 640, 189)
$g.DrawString('1', $label, $ink, 495, 170)
$g.DrawString('0..n', $label, $ink, 845, 170)

$g.DrawLine($pen, 480, 320, 900, 320)
$g.FillRectangle([System.Drawing.Brushes]::White, 620, 307, 140, 27)
$g.DrawString('TaskAssignee', $label, $ink, 632, 309)
$g.DrawString('0..1', $label, $ink, 495, 290)
$g.DrawString('0..n', $label, $ink, 845, 290)

$bitmap.Save((Join-Path (Get-Location) 'model.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$pen.Dispose()
$heading.Dispose()
$font.Dispose()
$label.Dispose()
$bitmap.Dispose()
