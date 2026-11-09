# Builds Oleg's walk/run cycles from the four standing poses cut 1:1 from the character sheet
# (assets/sprites/hero/idle_*.png). The sheet's own "walk" frames are nearly identical (legs never move),
# so the cycle is made by moving only the legs of the sheet art:
#   side views  - legs shear apart into a stride, then come back together (passing pose)
#   front/back  - left and right leg lift in turn
# Output: assets/sprites/hero/walk_{down,up,left,right}_{1..4}.png and run_{...}_{1..4}.png
param([string]$Root = (Split-Path -Parent $PSScriptRoot))
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Xaml
if (-not ('Img' -as [type])) { Add-Type -Path "$Root\tools\SpriteCut.cs" -ReferencedAssemblies PresentationCore, WindowsBase, System.Xaml }
$dir = "$Root\assets\sprites\hero"

# hip line = first row in the lower body where the silhouette gets narrower than the jacket (torso width at 68% height)
function Hip($img) {
  $rows = $img.RowRuns(1) -split "`n" | Where-Object { $_ -match ':' }
  $w = @(); foreach ($r in $rows) { $max = 0; $min = 9999; foreach ($m in [regex]::Matches($r, '(\d+)-(\d+)')) { $a = [int]$m.Groups[1].Value; $b = [int]$m.Groups[2].Value; if ($a -lt $min) { $min = $a }; if ($b -gt $max) { $max = $b } }; $w += [Math]::Max(0, $max - $min) }
  $torso = $w[[int]($img.H * 0.68)]
  for ($y = [int]($img.H * 0.72); $y -lt $img.H; $y++) { if ($w[$y] -lt 0.92 * $torso) { return $y } }
  return [int]($img.H * 0.75)
}
# split column = middle of the gap between the legs (front/back) or the centre of the legs (side)
function Split($img, $hip) {
  $y = [int](($hip + $img.H) / 2); $row = ($img.RowRuns(1) -split "`n")[$y]
  $runs = [regex]::Matches($row, '(\d+)-(\d+)')
  if ($runs.Count -ge 2) { return [int](([int]$runs[0].Groups[2].Value + [int]$runs[1].Groups[1].Value) / 2) }
  return [int](([int]$runs[0].Groups[1].Value + [int]$runs[$runs.Count - 1].Groups[2].Value) / 2)
}

foreach ($d in 'down', 'up', 'left', 'right') {
  $img = [Img]::Load("$dir\idle_$d.png")
  $hip = Hip $img; $split = Split $img $hip
  $removed = $img.KeyWarmLight($hip)
  $side = $d -eq 'left' -or $d -eq 'right'
  foreach ($kind in 'walk', 'run') {
    $amt = if ($kind -eq 'walk') { 15 } else { 26 }
    if ($side) {
      $frames = @($img.Step($hip, $split, $amt, 0, 0, 2), $img.Step($hip, $split, 0, 0, 0, 0), $img.Step($hip, $split, $amt, 0, 0, 2), $img.Step($hip, $split, 0, 0, 0, 0))
    } else {
      $frames = @($img.Step($hip, $split, 0, $amt, -1, 0), $img.Step($hip, $split, 0, 0, 0, 0), $img.Step($hip, $split, 0, $amt, 1, 0), $img.Step($hip, $split, 0, 0, 0, 0))
    }
    for ($i = 0; $i -lt 4; $i++) { $frames[$i].Save("$dir\${kind}_${d}_$($i + 1).png") }
  }
  "{0}: hip y={1}, split x={2}, size {3}x{4}, cleaned {5} px between legs" -f $d, $hip, $split, $img.W, $img.H, $removed
}
