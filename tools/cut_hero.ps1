# Cuts Oleg's on-foot sprites out of assets/source/character_sheet.webp (the user's character sheet)
# into assets/sprites/hero/*.png: idle_{down,right,up,left}.png, walk_right_{1..4}.png, run_right_{1..3}.png
# Run:  powershell -ExecutionPolicy Bypass -File tools\cut_hero.ps1
param([string]$Root = (Split-Path -Parent $PSScriptRoot))
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Xaml
if (-not ('Img' -as [type])) { Add-Type -Path "$Root\tools\SpriteCut.cs" -ReferencedAssemblies PresentationCore, WindowsBase, System.Xaml }
$sheet = [Img]::Load("$Root\assets\source\character_sheet.webp")
$out = "$Root\assets\sprites\hero"; New-Item -ItemType Directory -Force $out | Out-Null

function Cut($x0, $y0, $x1, $y1, $count, $names) {
  $strip = $sheet.Crop($x0, $y0, $x1 - $x0, $y1 - $y0)
  $strip.KeyOutLight(150, 75); $strip.KeyOutShadow(95, 250, 60)
  $comps = $strip.Components(600) | Sort-Object { $_[4] } -Descending | Select-Object -First $count | Sort-Object { $_[0] }
  $i = 0
  foreach ($b in $comps) {
    $strip.Crop($b[0], $b[1], $b[2], $b[3]).Save("$out\$($names[$i]).png")
    "{0}: {1}x{2} at ({3},{4})" -f $names[$i], $b[2], $b[3], ($x0 + $b[0]), ($y0 + $b[1])
    $i++
  }
}
# top panel: four facings (order on the sheet: down, right, up, left)
Cut 500 128 1240 345 4 @('idle_down', 'idle_right', 'idle_up', 'idle_left')
# animations panel: walk (4 frames, facing right) and run (3 frames, facing right)
Cut 500 465 785 600 4 @('walk_right_1', 'walk_right_2', 'walk_right_3', 'walk_right_4')
Cut 790 465 1050 600 3 @('run_right_1', 'run_right_2', 'run_right_3')
# dialog portrait: square crop of the big portrait panel (top-left), background kept as on the sheet
$sheet.Crop(50, 70, 400, 400).Save("$out\portrait.png"); 'portrait: 400x400 at (50,70)'
