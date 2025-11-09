# OWASP ZAP Security Scan Runner
# PMS-T-103: Automated security scanning script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PMS Security Scan - OWASP ZAP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ZAP is installed
$zapPath = "C:\Program Files\OWASP\Zed Attack Proxy\zap.bat"
if (-not (Test-Path $zapPath)) {
    Write-Host "ERROR: OWASP ZAP not found at: $zapPath" -ForegroundColor Red
    Write-Host "Please install OWASP ZAP from: https://www.zaproxy.org/download/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Run manual scan via ZAP GUI" -ForegroundColor Yellow
    exit 1
}

# Check if backend is running
Write-Host "Checking if backend server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend server is not running" -ForegroundColor Red
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Create reports directory if it doesn't exist
$reportsDir = Join-Path $PSScriptRoot "reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
    Write-Host "✓ Created reports directory" -ForegroundColor Green
}

# Run ZAP scan
Write-Host ""
Write-Host "Starting OWASP ZAP automated scan..." -ForegroundColor Yellow
Write-Host "This may take 10-15 minutes..." -ForegroundColor Yellow
Write-Host ""

$configPath = Join-Path $PSScriptRoot "owasp-zap-config.yaml"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

try {
    & $zapPath -cmd -autorun $configPath
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Scan Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Reports generated in: $reportsDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Review the HTML report in the reports directory" -ForegroundColor White
    Write-Host "2. Address any HIGH or MEDIUM severity findings" -ForegroundColor White
    Write-Host "3. Update SECURITY-TEST-RESULTS.md with findings" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: ZAP scan failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running ZAP manually:" -ForegroundColor Yellow
    Write-Host "1. Open OWASP ZAP GUI" -ForegroundColor White
    Write-Host "2. Set target: http://localhost:5000" -ForegroundColor White
    Write-Host "3. Run Spider and Active Scan" -ForegroundColor White
    Write-Host ""
    exit 1
}
