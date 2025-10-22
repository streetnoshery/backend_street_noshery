# Test Script for Kong + Street Noshery API
# This script tests the API endpoints through Kong

Write-Host "🧪 Testing Kong + Street Noshery API Setup" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

# Test 1: Health Check (No Auth Required)
Write-Host "`n1. Testing Health Check (No Auth Required)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
    Write-Host "✅ Health Check: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Health Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Customer API with Authentication
Write-Host "`n2. Testing Customer API with Authentication..." -ForegroundColor Yellow
try {
    $headers = @{
        "apikey" = "web-api-key-12345"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "http://localhost:8000/street-noshery/customer?mobileNumber=8107748619" -Method Get -Headers $headers
    Write-Host "✅ Customer API: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Customer API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 3: Customer API without Authentication (Should Fail)
Write-Host "`n3. Testing Customer API without Authentication (Should Fail)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/street-noshery/customer?mobileNumber=8107748619" -Method Get
    Write-Host "❌ Customer API without Auth: UNEXPECTED SUCCESS" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Customer API without Auth: CORRECTLY REJECTED (401)" -ForegroundColor Green
    } else {
        Write-Host "❌ Customer API without Auth: FAILED with unexpected error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Direct Backend Access (Bypass Kong)
Write-Host "`n4. Testing Direct Backend Access (Bypass Kong)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3020/street-noshery/customer?mobileNumber=8107748619" -Method Get
    Write-Host "✅ Direct Backend: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Direct Backend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 5: Kong Admin API
Write-Host "`n5. Testing Kong Admin API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/services" -Method Get
    Write-Host "✅ Kong Admin API: PASSED" -ForegroundColor Green
    Write-Host "Services found: $($response.data.Count)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Kong Admin API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Kong Status
Write-Host "`n6. Testing Kong Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/status" -Method Get
    Write-Host "✅ Kong Status: PASSED" -ForegroundColor Green
    Write-Host "Kong Version: $($response.version)" -ForegroundColor Cyan
    Write-Host "Database: $($response.database)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Kong Status: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test Summary:" -ForegroundColor Blue
Write-Host "================" -ForegroundColor Blue
Write-Host "• Kong Proxy: http://localhost:8000" -ForegroundColor White
Write-Host "• Kong Admin: http://localhost:8001" -ForegroundColor White
Write-Host "• Kong Manager: http://localhost:8002" -ForegroundColor White
Write-Host "• Direct Backend: http://localhost:3020" -ForegroundColor White
Write-Host "`n🔑 API Keys:" -ForegroundColor Blue
Write-Host "• Web: web-api-key-12345" -ForegroundColor White
Write-Host "• Mobile: mobile-api-key-67890" -ForegroundColor White
Write-Host "• Admin: admin-api-key-11111" -ForegroundColor White

Write-Host "`n🎯 Test Commands:" -ForegroundColor Blue
Write-Host "• Health: Invoke-RestMethod -Uri 'http://localhost:8000/health'" -ForegroundColor White
Write-Host "• Customer: Invoke-RestMethod -Uri 'http://localhost:8000/street-noshery/customer?mobileNumber=8107748619' -Headers @{'apikey'='web-api-key-12345'}" -ForegroundColor White
Write-Host "• Direct: Invoke-RestMethod -Uri 'http://localhost:3020/street-noshery/customer?mobileNumber=8107748619'" -ForegroundColor White
