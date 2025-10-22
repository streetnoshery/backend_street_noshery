# Kong Setup Script for Street Noshery Project (PowerShell)
# This script helps configure Kong services, routes, and authentication

param(
    [switch]$SkipTests
)

# Kong Admin API URL
$KONG_ADMIN_URL = "http://localhost:8001"

Write-Host "🚀 Kong Setup Script for Street Noshery" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Function to check if Kong is running
function Test-KongStatus {
    Write-Host "📡 Checking Kong status..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -ErrorAction Stop
        Write-Host "✅ Kong is running and accessible" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Kong is not accessible at $KONG_ADMIN_URL" -ForegroundColor Red
        Write-Host "Please make sure Kong is running with: docker-compose up -d" -ForegroundColor Red
        return $false
    }
}

# Function to create service
function New-KongService {
    Write-Host "🔧 Creating Street Noshery service..." -ForegroundColor Yellow
    
    $serviceData = @{
        name = "street-noshery-backend"
        url = "http://backend:3020"
        connect_timeout = 60000
        write_timeout = 60000
        read_timeout = 60000
        retries = 5
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/" -Method Post -Body $serviceData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ Service created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create service: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to create routes
function New-KongRoutes {
    Write-Host "🛣️  Creating routes..." -ForegroundColor Yellow
    
    # Main API route
    $mainRouteData = @{
        name = "street-noshery-main-route"
        "paths[]" = "/street-noshery"
        strip_path = "false"
        "methods[]" = @("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/street-noshery-backend/routes" -Method Post -Body $mainRouteData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ Main route created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create main route: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Health check route (no auth)
    $healthRouteData = @{
        name = "street-noshery-health-route"
        "paths[]" = "/health"
        strip_path = "false"
        "methods[]" = "GET"
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/street-noshery-backend/routes" -Method Post -Body $healthRouteData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ Health route created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create health route: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Public routes (no auth)
    $publicRouteData = @{
        name = "street-noshery-public-route"
        "paths[]" = @("/street-noshery/auth/login", "/street-noshery/auth/register", "/street-noshery/auth/forgot-password", "/street-noshery/menu/public")
        strip_path = "false"
        "methods[]" = @("GET", "POST", "OPTIONS")
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/street-noshery-backend/routes" -Method Post -Body $publicRouteData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ Public routes created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create public routes: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to create consumers
function New-KongConsumers {
    Write-Host "👥 Creating API consumers..." -ForegroundColor Yellow
    
    # Web client consumer
    $webConsumerData = @{
        username = "street-noshery-web-client"
        custom_id = "web-client-001"
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/consumers/" -Method Post -Body $webConsumerData -ContentType "application/x-www-form-urlencoded"
        
        $webKeyData = @{
            key = "web-api-key-12345"
        }
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/consumers/street-noshery-web-client/key-auth" -Method Post -Body $webKeyData -ContentType "application/x-www-form-urlencoded"
        
        Write-Host "✅ Web client consumer created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create web client consumer: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Mobile client consumer
    $mobileConsumerData = @{
        username = "street-noshery-mobile-client"
        custom_id = "mobile-client-001"
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/consumers/" -Method Post -Body $mobileConsumerData -ContentType "application/x-www-form-urlencoded"
        
        $mobileKeyData = @{
            key = "mobile-api-key-67890"
        }
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/consumers/street-noshery-mobile-client/key-auth" -Method Post -Body $mobileKeyData -ContentType "application/x-www-form-urlencoded"
        
        Write-Host "✅ Mobile client consumer created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create mobile client consumer: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Admin client consumer
    $adminConsumerData = @{
        username = "street-noshery-admin-client"
        custom_id = "admin-client-001"
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/consumers/" -Method Post -Body $adminConsumerData -ContentType "application/x-www-form-urlencoded"
        
        $adminKeyData = @{
            key = "admin-api-key-11111"
        }
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/consumers/street-noshery-admin-client/key-auth" -Method Post -Body $adminKeyData -ContentType "application/x-www-form-urlencoded"
        
        Write-Host "✅ Admin client consumer created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create admin client consumer: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to enable plugins
function Enable-KongPlugins {
    Write-Host "🔌 Enabling plugins..." -ForegroundColor Yellow
    
    # CORS plugin
    $corsData = @{
        name = "cors"
        "config.origins[]" = "*"
        "config.methods[]" = @("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        "config.headers[]" = @("Accept", "Content-Type", "Authorization", "apikey", "x-api-key")
        "config.exposed_headers[]" = @("X-Auth-Token", "X-Response-Time")
        "config.credentials" = "true"
        "config.max_age" = 3600
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/street-noshery-backend/plugins" -Method Post -Body $corsData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ CORS plugin enabled successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to enable CORS plugin: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Rate limiting plugin
    $rateLimitData = @{
        name = "rate-limiting"
        "config.minute" = 100
        "config.hour" = 1000
        "config.day" = 10000
        "config.policy" = "local"
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/street-noshery-backend/plugins" -Method Post -Body $rateLimitData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ Rate limiting plugin enabled successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to enable rate limiting plugin: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Key authentication plugin (for protected routes only)
    $keyAuthData = @{
        name = "key-auth"
        "config.key_names[]" = @("apikey", "x-api-key")
        "config.hide_credentials" = "false"
    }
    
    try {
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/routes/street-noshery-main-route/plugins" -Method Post -Body $keyAuthData -ContentType "application/x-www-form-urlencoded"
        Write-Host "✅ Key authentication plugin enabled successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to enable key authentication plugin: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to test the setup
function Test-KongSetup {
    if ($SkipTests) {
        Write-Host "⏭️  Skipping tests as requested" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🧪 Testing the setup..." -ForegroundColor Yellow
    
    # Test health endpoint (no auth required)
    Write-Host "Testing health endpoint..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
        Write-Host "✅ Health endpoint test passed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Health endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test API endpoint with authentication
    Write-Host "Testing API endpoint with authentication..."
    try {
        $headers = @{
            "apikey" = "web-api-key-12345"
        }
        $response = Invoke-RestMethod -Uri "http://localhost:8000/street-noshery/health" -Method Get -Headers $headers
        Write-Host "✅ API endpoint test passed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ API endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to display usage information
function Show-UsageInfo {
    Write-Host "📋 Kong Setup Complete!" -ForegroundColor Blue
    Write-Host "==========================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🌐 Access Points:" -ForegroundColor Green
    Write-Host "• Kong Proxy: http://localhost:8000"
    Write-Host "• Kong Admin API: http://localhost:8001"
    Write-Host "• Kong Manager (GUI): http://localhost:8002"
    Write-Host "• Konga (Alternative GUI): http://localhost:1337"
    Write-Host ""
    Write-Host "🔑 API Keys:" -ForegroundColor Green
    Write-Host "• Web Client: web-api-key-12345"
    Write-Host "• Mobile Client: mobile-api-key-67890"
    Write-Host "• Admin Client: admin-api-key-11111"
    Write-Host ""
    Write-Host "📡 Test Commands:" -ForegroundColor Green
    Write-Host "• Health check (no auth): Invoke-RestMethod -Uri 'http://localhost:8000/health'"
    Write-Host "• API with auth: Invoke-RestMethod -Uri 'http://localhost:8000/street-noshery/' -Headers @{'apikey'='web-api-key-12345'}"
    Write-Host ""
    Write-Host "🛠️  Management:" -ForegroundColor Green
    Write-Host "• View services: Invoke-RestMethod -Uri '$KONG_ADMIN_URL/services'"
    Write-Host "• View routes: Invoke-RestMethod -Uri '$KONG_ADMIN_URL/routes'"
    Write-Host "• View consumers: Invoke-RestMethod -Uri '$KONG_ADMIN_URL/consumers'"
    Write-Host "• View plugins: Invoke-RestMethod -Uri '$KONG_ADMIN_URL/plugins'"
}

# Main execution
function Main {
    if (-not (Test-KongStatus)) {
        exit 1
    }
    
    New-KongService
    New-KongRoutes
    New-KongConsumers
    Enable-KongPlugins
    Test-KongSetup
    Show-UsageInfo
}

# Run the main function
Main
