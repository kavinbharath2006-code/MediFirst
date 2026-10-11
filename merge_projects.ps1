$backendPath = "C:\MediFirst\backend"
$frontendPath = "C:\MediFirst\backend\frontend"

# 1. Remove the old vanilla frontend (public folder) present in the backend folder
if (Test-Path "$backendPath\public") {
    Write-Host "Removing old frontend files (public folder) from backend..."
    Remove-Item -Recurse -Force "$backendPath\public"
}

# 2. Move the React frontend folder inside the backend folder to combine them
if (Test-Path $frontendPath) {
    Write-Host "Moving React frontend into the backend..."
    Move-Item -Path $frontendPath -Destination "$backendPath\frontend" -Force
}

# 3. Rename the combined folder to 'medifirst-combined'
Write-Host "Renaming backend folder to a unified project folder..."
Rename-Item -Path $backendPath -NewName "medifirst-combined"

Write-Host "Project successfully combined into C:\MediFirst\medifirst-combined!"
