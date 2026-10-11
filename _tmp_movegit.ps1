# Move nested frontend\.git to _backup\frontend.git (never delete)
$src = 'c:\MediFirst\frontend\.git'
$dst = 'c:\MediFirst\_backup\frontend.git'
if (Test-Path $src) {
  if (Test-Path $dst) {
    Write-Output "ABORT: $dst already exists; source left in place."
  } else {
    Move-Item -Path $src -Destination $dst
    Write-Output "MOVED frontend\.git -> _backup\frontend.git"
  }
} else {
  Write-Output "frontend\.git not found (already moved?)"
}
Write-Output "frontend\.git exists now: $(Test-Path $src)"
Write-Output "_backup\frontend.git exists now: $(Test-Path $dst)"
