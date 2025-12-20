# Development Scripts - Windows (PowerShell)

Write-Host "🚀 Starting GovTrip Intelligence Development Environment..." -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green

# Start Docker services
Write-Host "`nStarting Docker services..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "..")
docker-compose -f docker/docker-compose.yml up -d postgres redis

# Wait for PostgreSQL
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    Start-Sleep -Seconds 2
    $pgReady = docker exec govtrip-postgres pg_isready 2>$null
    if ($pgReady) {
        Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
        break
    }
    Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "❌ PostgreSQL failed to start" -ForegroundColor Red
    exit 1
}

# Run Prisma migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
Set-Location -Path "apps/web"
npx prisma generate
npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database migrated successfully" -ForegroundColor Green

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install
}

# Start development server
Write-Host "`n🎉 Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor Green
Write-Host "   GovTrip: http://localhost:3000/govtrip" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

npm run dev
