# Cuts the cows 1:1 out of assets/source/cows_sheet.webp (the user's sheet, dark purple background)
# into assets/sprites/cows/: {variant}_{anim}_{n}.png, calf_{n}.png, fx_{name}.png.
#   variants (columns on the sheet): spotted (біла з рудими плямами), holstein (чорно-біла), red (руда), brown (темно-бура)
#   anims (rows): walk_down 4, walk_up 4, walk_left 3, walk_right 3, idle 2, eat 3, moo 2, lie 3
# Frames of one variant+anim share one canvas (feet on the bottom edge, body centred) so animations don't jitter.
# Small detached bits (the "moo" sound marks) are merged into the nearest frame.
param([string]$Root = (Split-Path -Parent $PSScriptRoot))
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Xaml
if (-not ('Img' -as [type])) { Add-Type -Path "$Root\tools\SpriteCut.cs" -ReferencedAssemblies PresentationCore, WindowsBase, System.Xaml }
$sheet = [Img]::Load("$Root\assets\source\cows_sheet.webp")
$out = "$Root\assets\sprites\cows"; New-Item -ItemType Directory -Force $out | Out-Null
Get-ChildItem $out -Filter *.png | Remove-Item

function Strip($x0, $y0, $x1, $y1) { $s = $sheet.Crop($x0, $y0, $x1 - $x0, $y1 - $y0); $s.KeyOutFlood(56, 46, 64, 48); $s.KeyOutPurple(); return $s }
# components with tiny ones merged into the nearest big one; returns bboxes sorted by x
function Frames($s, $minBig) {
  $all = @($s.Components(25)); $big = @($all | Where-Object { $_[4] -ge $minBig }); $small = @($all | Where-Object { $_[4] -lt $minBig })
  $boxes = @(); foreach ($b in $big) { $boxes += , @($b[0], $b[1], ($b[0] + $b[2]), ($b[1] + $b[3])) }
  foreach ($c in $small) {
    $cx = $c[0] + $c[2] / 2; $cy = $c[1] + $c[3] / 2; $best = -1; $bd = 1e9
    for ($k = 0; $k -lt $boxes.Count; $k++) { $bx = [Math]::Max($boxes[$k][0], [Math]::Min($cx, $boxes[$k][2])); $by = [Math]::Max($boxes[$k][1], [Math]::Min($cy, $boxes[$k][3])); $d = [Math]::Abs($bx - $cx) + [Math]::Abs($by - $cy); if ($d -lt $bd) { $bd = $d; $best = $k } }
    if ($best -ge 0 -and $bd -lt 30) { $b = $boxes[$best]; $boxes[$best] = @([Math]::Min($b[0], $c[0]), [Math]::Min($b[1], $c[1]), [Math]::Max($b[2], $c[0] + $c[2]), [Math]::Max($b[3], $c[1] + $c[3])) }
  }
  return @($boxes | Sort-Object { $_[0] })
}
# put a list of frames on one canvas: bottoms aligned, horizontally centred
function SaveSet($s, $boxes, $prefix) {
  $w = 0; $h = 0; foreach ($b in $boxes) { $w = [Math]::Max($w, $b[2] - $b[0]); $h = [Math]::Max($h, $b[3] - $b[1]) }
  $i = 0; foreach ($b in $boxes) { $i++; $f = $s.Crop($b[0], $b[1], $b[2] - $b[0], $b[3] - $b[1]); $f.Place($w + 2, $h, [int](($w + 2 - $f.W) / 2), $h - $f.H).Save("$out\${prefix}_$i.png") }
  return "{0}: {1} frames {2}x{3}" -f $prefix, $boxes.Count, ($w + 2), $h
}
$variants = @('spotted', 'holstein', 'red', 'brown')
$rows = @(
  @{ anim = 'walk_down';  y0 = 24;  y1 = 106; n = 4 }, @{ anim = 'walk_up';    y0 = 120; y1 = 204; n = 4 },
  @{ anim = 'walk_left';  y0 = 222; y1 = 304; n = 3 }, @{ anim = 'walk_right'; y0 = 318; y1 = 400; n = 3 },
  @{ anim = 'idle';       y0 = 414; y1 = 498; n = 2 }, @{ anim = 'eat';        y0 = 512; y1 = 596; n = 3 },
  @{ anim = 'moo';        y0 = 608; y1 = 690; n = 2 }, @{ anim = 'lie';        y0 = 702; y1 = 784; n = 3 }
)
foreach ($r in $rows) {
  $s = Strip 405 $r.y0 1488 $r.y1
  $boxes = @($s.SplitFramesN(3, 16, $r.n * 4))
  if ($boxes.Count -ne $r.n * 4) { "WARNING {0}: found {1} frames, expected {2}" -f $r.anim, $boxes.Count, ($r.n * 4) }
  for ($v = 0; $v -lt 4; $v++) { SaveSet $s @($boxes[($v * $r.n)..($v * $r.n + $r.n - 1)]) "$($variants[$v])_$($r.anim)" }
}
# calf row and extras (icons, grass, hay, trough)
$s = Strip 262 860 925 950; $boxes = @($s.SplitFramesN(3, 16, 8)); "calf: {0} frames" -f $boxes.Count
$i = 0; foreach ($b in $boxes) { $i++; $s.Crop($b[0], $b[1], $b[2] - $b[0], $b[3] - $b[1]).Save("$out\calf_$i.png") }
$s = Strip 955 850 1488 955; $all = @($s.Components(40) | Sort-Object { $_[0] }); "extras: {0} parts" -f $all.Count
$i = 0; foreach ($b in $all) { $i++; $s.Crop($b[0], $b[1], $b[2], $b[3]).Save("$out\fx_$i.png"); "  fx_{0}: {1}x{2} at {3},{4} area {5}" -f $i, $b[2], $b[3], (955 + $b[0]), (850 + $b[1]), $b[4] }
