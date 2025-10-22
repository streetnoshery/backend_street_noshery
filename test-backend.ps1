# Test Backend Directly
Write-Host "Testing Backend Directly..." -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3020/street-noshery/health" -Method Get
    Write-Host "✅ Health Check: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
}
catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Customer GET (should be 404 if no customer exists)
Write-Host "`n2. Testing Customer GET..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3020/street-noshery/customer?mobileNumber=8107748619" -Method Get
    Write-Host "✅ Customer GET: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
}
catch {
    Write-Host "❌ Customer GET: FAILED (Expected if no customer exists)" -ForegroundColor Yellow
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 3: Customer CREATE
Write-Host "`n3. Testing Customer CREATE..." -ForegroundColor Cyan
$createBody = @{
    mobileNumber = "8107748610"
    countryCode = "+91"
    email = "sumitgod510@gmail.com"
    password = "Sumit@1062"
    userName = "Sumit Kumar Godwan"
    firstLine = "Sigma Tech Park"
    secondLine = "Bangalore"
    shopId = "1"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3020/street-noshery/customer/create" -Method Post -Body $createBody -ContentType "application/json"
    Write-Host "✅ Customer CREATE: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
}
catch {
    Write-Host "❌ Customer CREATE: FAILED" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Customer GET after CREATE (should work now)
Write-Host "`n4. Testing Customer GET after CREATE..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3020/street-noshery/customer?mobileNumber=8107748610" -Method Get
    Write-Host "✅ Customer GET after CREATE: PASSED" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
}
catch {
    Write-Host "❌ Customer GET after CREATE: FAILED" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nBackend Test Complete!" -ForegroundColor Blue
