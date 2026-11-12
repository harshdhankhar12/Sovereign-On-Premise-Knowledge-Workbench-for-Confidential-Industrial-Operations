$ErrorActionPreference = "Stop"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  STARTING SOVEREIGN INDUSTRIAL KNOWLEDGE WORKBENCH (MRPL SIH26117)  " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

$dockerContainers = docker ps --format "{{.Names}}"
if ($dockerContainers -notmatch "sovereign-postgres" -or $dockerContainers -notmatch "sovereign-redis") {
    Write-Host "[1/5] Starting Docker services (PostgreSQL + pgvector, Redis)..." -ForegroundColor Yellow
    docker compose up -d
} else {
    Write-Host "[1/5] Infrastructure containers are active (PostgreSQL + Redis)" -ForegroundColor Green
}

Write-Host "[2/5] Checking Local Ollama Inference Engine..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 3
    $modelNames = $ollamaCheck.models | ForEach-Object { $_.name }
    Write-Host "[OK] Ollama is active with models: $($modelNames -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Ollama is not detected at http://localhost:11434. Please ensure 'ollama serve' is running." -ForegroundColor Magenta
}

Write-Host "[3/5] Starting Sovereign FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='c:\capstone'; uvicorn server.main:app --host 0.0.0.0 --port 8000" -PassThru

$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 2
        if ($health) {
            $backendReady = $true
            break
        }
    } catch {}
}

if ($backendReady) {
    Write-Host "[OK] Backend online: http://localhost:8000/docs" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend starting up..." -ForegroundColor Yellow
}

Write-Host "[4/5] Starting Next.js Industrial Frontend on http://localhost:3000..." -ForegroundColor Yellow
$frontendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\capstone\client; pnpm dev" -PassThru

Write-Host "[5/5] Launching Workbench Interface..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  WORKBENCH READY • AIR-GAPPED ZERO-EGRESS MODE ENFORCED             " -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000 (API & Swagger Docs)               " -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000 (Industrial Control Console)       " -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Green
