Write-Host "Starting Zaak Construction Invoice Generator..." -ForegroundColor Cyan

# Start backend
$backendJob = Start-Job -ScriptBlock {
  Set-Location "$using:PWD\backend"
  npm start
}

# Start frontend
$frontendJob = Start-Job -ScriptBlock {
  Set-Location "$using:PWD\frontend"
  npm run dev
}

Write-Host "Backend starting on http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend starting on http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

try {
  while ($true) {
    Start-Sleep -Seconds 1
    Receive-Job -Job $backendJob
    Receive-Job -Job $frontendJob
  }
} finally {
  Stop-Job $backendJob
  Stop-Job $frontendJob
  Remove-Job $backendJob
  Remove-Job $frontendJob
}
