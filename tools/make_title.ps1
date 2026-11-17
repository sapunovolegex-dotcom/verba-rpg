# Converts the user's title screen (assets/source/title_screen.png, made in ChatGPT and approved by the user) into
# assets/title/title.jpg for the game: same pixels, JPEG q92 (the PNG is ~2.8 MB, too heavy for the first screen).
param([string]$Root = (Split-Path -Parent $PSScriptRoot))
Add-Type -AssemblyName PresentationCore, WindowsBase
$src = New-Object System.Windows.Media.Imaging.BitmapImage
$src.BeginInit(); $src.UriSource = New-Object Uri("$Root\assets\source\title_screen.png"); $src.CacheOption = 'OnLoad'; $src.EndInit()
$enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder; $enc.QualityLevel = 92
$enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($src))
New-Item -ItemType Directory -Force "$Root\assets\title" | Out-Null
$fs = [IO.File]::Create("$Root\assets\title\title.jpg"); $enc.Save($fs); $fs.Close()
"{0}x{1} -> assets/title/title.jpg" -f $src.PixelWidth, $src.PixelHeight
