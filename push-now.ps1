$ErrorActionPreference = 'Stop'

Write-Host "Checking git status..."
git status

Write-Host "`nAdding all changes..."
git add .

Write-Host "`nCreating commit..."
git commit -m "otomatis"

Write-Host "`nPushing to origin main..."
git push origin main

Write-Host "`nDone."
