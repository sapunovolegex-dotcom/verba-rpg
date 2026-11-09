# Cuts the motorcycle riding frames and the big bike pictures out of assets/source/moto_sheet.webp
# (the user's sprite sheet) into assets/sprites/moto/*.png with transparent background.
# Run:  powershell -ExecutionPolicy Bypass -File tools\cut_moto.ps1
param([string]$Root = (Split-Path -Parent $PSScriptRoot))
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Xaml
if (-not ('Img' -as [type])) { Add-Type -Path "$Root\tools\SpriteCut.cs" -ReferencedAssemblies PresentationCore, WindowsBase, System.Xaml }
$sheet = [Img]::Load("$Root\assets\source\moto_sheet.webp")
$out = "$Root\assets\sprites\moto"; New-Item -ItemType Directory -Force $out | Out-Null

# Layout of the sheet (pixels): three bike rows, four direction columns with two frames each.
$rows = @(
  @{ id = 'street'; y0 = 128; y1 = 405; big = @(355, 135, 400, 265) },
  @{ id = 'retro';  y0 = 460; y1 = 727; big = @(355, 470, 400, 255) },
  @{ id = 'sport';  y0 = 783; y1 = 1045; big = @(355, 795, 400, 250) }
)
$cols = @(
  @{ dir = 'down';  x0 = 757;  x1 = 912 },
  @{ dir = 'up';    x0 = 918;  x1 = 1072 },
  @{ dir = 'left';  x0 = 1079; x1 = 1244 },
  @{ dir = 'right'; x0 = 1251; x1 = 1436 }
)
$report = @()
foreach ($r in $rows) {
  foreach ($c in $cols) {
    $strip = $sheet.Crop($c.x0, $r.y0, $c.x1 - $c.x0, $r.y1 - $r.y0)
    $strip.KeyOutLight(150, 75); $strip.KeyOutShadow(95, 250, 60)
    $comps = $strip.Components(400) | Sort-Object { $_[4] } -Descending | Select-Object -First 2 | Sort-Object { $_[1] }
    $n = 0
    foreach ($b in $comps) {
      $n++
      $fr = $strip.Crop($b[0], $b[1], $b[2], $b[3])
      $fr.Save("$out\$($r.id)_$($c.dir)_$n.png")
      $report += "{0}_{1}_{2}: {3}x{4} at ({5},{6})" -f $r.id, $c.dir, $n, $b[2], $b[3], ($c.x0 + $b[0]), ($r.y0 + $b[1])
    }
  }
  $bg = $sheet.Crop($r.big[0], $r.big[1], $r.big[2], $r.big[3]); $bg.KeyOutLight(150, 75); $bg.KeyOutShadow(95, 250, 60)
  $b = $null; foreach ($cc in $bg.Components(2000)) { if ($null -eq $b -or $cc[4] -gt $b[4]) { $b = $cc } }
  if ($b) { $bg.Crop($b[0], $b[1], $b[2], $b[3]).Save("$out\$($r.id)_big.png"); $report += "{0}_big: {1}x{2}" -f $r.id, $b[2], $b[3] }
}
$report


