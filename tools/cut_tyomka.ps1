# Cuts Тьомка's sprites 1:1 out of assets/source/tyomka_sheet.webp (the user's sheet) into assets/sprites/tyomka/.
#  walk_{row}_{1..4}.png / run_{row}_{1..3}.png — rows: 1 down, 2 right, 3 up, 4 left.
#    Every frame of a row is placed on one shared canvas: feet on the bottom edge, head centred horizontally,
#    so the animation does not jitter sideways when frames of different width alternate.
#  idle_{row}.png — the frame of that row with the feet closest together.
#  emo_{name}.png — dialog portraits: the whole emotion tile (head + shoulders), padded to a square with its own blue.
param([string]$Root = (Split-Path -Parent $PSScriptRoot))
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Xaml
if (-not ('Img' -as [type])) { Add-Type -Path "$Root\tools\SpriteCut.cs" -ReferencedAssemblies PresentationCore, WindowsBase, System.Xaml }
$sheet = [Img]::Load("$Root\assets\source\tyomka_sheet.webp")
$out = "$Root\assets\sprites\tyomka"; New-Item -ItemType Directory -Force $out | Out-Null
Get-ChildItem $out -Filter *.png | Remove-Item

function Grid($name, $x0, $y0, $x1, $y1, $cols) {
  $s = $sheet.Crop($x0, $y0, $x1 - $x0, $y1 - $y0); $s.KeyOutLight(150, 75); $s.KeyOutShadow(95, 250, 60)
  $comps = @($s.Components(800) | Sort-Object { $_[1] })
  for ($i = 0; $i -lt $comps.Count; $i += $cols) {
    $r = $i / $cols + 1
    $frames = @($comps[$i..($i + $cols - 1)] | Sort-Object { $_[0] } | ForEach-Object { $s.Crop($_[0], $_[1], $_[2], $_[3]) })
    $hc = @($frames | ForEach-Object { $_.HeadCenterX(0.35) })
    $left = 0; $right = 0; $h = 0
    for ($k = 0; $k -lt $frames.Count; $k++) { $left = [Math]::Max($left, [Math]::Ceiling($hc[$k])); $right = [Math]::Max($right, $frames[$k].W - [Math]::Floor($hc[$k])); $h = [Math]::Max($h, $frames[$k].H) }
    $best = 0; $bestSpan = 99999
    for ($k = 0; $k -lt $frames.Count; $k++) {
      $f = $frames[$k]
      $placed = $f.Place($left + $right, $h, [int]($left - $hc[$k]), $h - $f.H)
      $placed.Save("$out\${name}_${r}_$($k + 1).png")
      $span = $f.FootSpan(0.2); if ($span -lt $bestSpan) { $bestSpan = $span; $best = $k }
    }
    if ($name -eq 'walk') { Copy-Item "$out\walk_${r}_$($best + 1).png" "$out\idle_$r.png" }
    "{0} row {1}: {2} frames on {3}x{4}, idle = frame {5}" -f $name, $r, $frames.Count, ($left + $right), $h, ($best + 1)
  }
}
Grid 'walk' 335 65 665 670 4
Grid 'run' 680 65 965 670 3

# emotion portraits: whole tile minus its rounded border, padded to a square with the tile's own background
$emo = @('neutral', 'smile', 'laugh', 'serious', 'thinking', 'surprised', 'angry', 'sad', 'wink')
$xs = @(20, 135, 246, 358, 467, 578, 688, 798, 906); $ws = @(110, 106, 106, 104, 106, 105, 105, 103, 106)
for ($i = 0; $i -lt 9; $i++) {
  $tile = $sheet.Crop($xs[$i] + 4, 758, $ws[$i] - 8, 166)
  # background colour: first clearly blue pixel scanning the left margin (skips the dark rounded border)
  $bg = $null
  foreach ($yy in 30, 50, 70, 90, 110) { for ($xx = 2; $xx -lt 14 -and -not $bg; $xx++) {
    $p = (($yy * $tile.W) + $xx) * 4; $r = $tile.P[$p + 2]; $g = $tile.P[$p + 1]; $b = $tile.P[$p]
    if ($b -gt $r + 25 -and $b -gt 120) { $bg = @($r, $g, $b) } } }
  if (-not $bg) { $bg = @(98, 96, 170) }
  $tile.PadSquare($bg[0], $bg[1], $bg[2]).Save("$out\emo_$($emo[$i]).png")
}
'emotions: 9 (square, whole head)'
