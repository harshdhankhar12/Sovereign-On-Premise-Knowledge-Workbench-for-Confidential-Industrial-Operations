Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host "  STOPPING SOVEREIGN INDUSTRIAL KNOWLEDGE WORKBENCH SERVICES        " -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Yellow

$uvicornProcesses = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "uvicorn server.main:app" }
if ($uvicornProcesses) {
    Write-Host "Stopping FastAPI backend processes..." -ForegroundColor Yellow
    $uvicornProcesses | Stop-Process -Force
    Write-Host "[OK] Backend stopped." -ForegroundColor Green
}

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" }
if ($nodeProcesses) {
    Write-Host "Stopping Next.js frontend processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "[OK] Frontend stopped." -ForegroundColor Green
}

Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  ALL LOCAL WORKBENCH SERVICES TERMINATED SAFELY                     " -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green

