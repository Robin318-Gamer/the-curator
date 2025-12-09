# Test automation endpoints locally
Write-Host "Testing automation endpoints..." -ForegroundColor Cyan

# Test 1: Bulk Save HK01
Write-Host "`n=== Testing Bulk Save HK01 ===" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/automation/bulk-save/hk01" -Method POST -TimeoutSec 30
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 2: Bulk Save MingPao
Write-Host "`n=== Testing Bulk Save MingPao ===" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/automation/bulk-save/mingpao" -Method POST -TimeoutSec 30
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 3: Process Newslist
Write-Host "`n=== Testing Process Newslist ===" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/newslist/process" -Method POST -TimeoutSec 60
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
