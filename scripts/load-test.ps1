# Load Test Script for Kong Auto-Scaling
param(
    [int]$Duration = 300,  # Duration in seconds
    [int]$ConcurrentRequests = 50,
    [int]$RequestInterval = 100  # Milliseconds between requests
)

$KONG_PROXY_URL = "http://localhost:8000"
$headers = @{ apikey = "web-api-key-12345" }

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Endpoint {
    param([string]$Url, [hashtable]$Headers)
    
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers -TimeoutSec 10
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        return @{
            Success = $true
            ResponseTime = $responseTime
            StatusCode = 200
        }
    }
    catch {
        return @{
            Success = $false
            ResponseTime = 0
            StatusCode = $_.Exception.Response.StatusCode.value__
            Error = $_.Exception.Message
        }
    }
}

function Start-LoadTest {
    Write-ColorOutput "🚀 Starting Load Test" "Blue"
    Write-ColorOutput "=====================" "Blue"
    Write-ColorOutput "Duration: $Duration seconds" "White"
    Write-ColorOutput "Concurrent Requests: $ConcurrentRequests" "White"
    Write-ColorOutput "Request Interval: $RequestInterval ms" "White"
    Write-ColorOutput "Target URL: $KONG_PROXY_URL/street-noshery/customer" "White"
    Write-ColorOutput "" "White"
    
    $endTime = (Get-Date).AddSeconds($Duration)
    $requestCount = 0
    $successCount = 0
    $totalResponseTime = 0
    $errors = @()
    
    Write-ColorOutput "⏰ Load test started at $(Get-Date -Format 'HH:mm:ss')" "Green"
    
    while ((Get-Date) -lt $endTime) {
        $jobs = @()
        
        # Start concurrent requests
        for ($i = 0; $i -lt $ConcurrentRequests; $i++) {
            $job = Start-Job -ScriptBlock {
                param($Url, $Headers)
                try {
                    $startTime = Get-Date
                    $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers -TimeoutSec 10
                    $endTime = Get-Date
                    $responseTime = ($endTime - $startTime).TotalMilliseconds
                    
                    return @{
                        Success = $true
                        ResponseTime = $responseTime
                        StatusCode = 200
                    }
                }
                catch {
                    return @{
                        Success = $false
                        ResponseTime = 0
                        StatusCode = $_.Exception.Response.StatusCode.value__
                        Error = $_.Exception.Message
                    }
                }
            } -ArgumentList "$KONG_PROXY_URL/street-noshery/customer", $headers
            
            $jobs += $job
        }
        
        # Wait for all requests to complete
        $results = $jobs | Receive-Job -Wait -AutoRemoveJob
        
        # Process results
        foreach ($result in $results) {
            $requestCount++
            
            if ($result.Success) {
                $successCount++
                $totalResponseTime += $result.ResponseTime
            }
            else {
                $errors += $result.Error
            }
        }
        
        # Show progress
        $elapsed = $Duration - ($endTime - (Get-Date)).TotalSeconds
        $progress = [math]::Round(($elapsed / $Duration) * 100, 1)
        $avgResponseTime = if ($successCount -gt 0) { [math]::Round($totalResponseTime / $successCount, 2) } else { 0 }
        $successRate = if ($requestCount -gt 0) { [math]::Round(($successCount / $requestCount) * 100, 2) } else { 0 }
        
        Write-ColorOutput "📊 Progress: $progress% | Requests: $requestCount | Success: $successRate% | Avg Response: ${avgResponseTime}ms" "Cyan"
        
        # Wait before next batch
        Start-Sleep -Milliseconds $RequestInterval
    }
    
    Write-ColorOutput "" "White"
    Write-ColorOutput "🏁 Load Test Completed" "Green"
    Write-ColorOutput "=====================" "Green"
    Write-ColorOutput "Total Requests: $requestCount" "White"
    Write-ColorOutput "Successful Requests: $successCount" "White"
    Write-ColorOutput "Success Rate: $([math]::Round(($successCount / $requestCount) * 100, 2))%" "White"
    Write-ColorOutput "Average Response Time: $([math]::Round($totalResponseTime / $successCount, 2))ms" "White"
    
    if ($errors.Count -gt 0) {
        Write-ColorOutput "Errors encountered: $($errors.Count)" "Yellow"
        $uniqueErrors = $errors | Group-Object | Sort-Object Count -Descending
        foreach ($error in $uniqueErrors) {
            Write-ColorOutput "  $($error.Name): $($error.Count) times" "Yellow"
        }
    }
}

function Start-SimpleLoadTest {
    Write-ColorOutput "🚀 Starting Simple Load Test" "Blue"
    Write-ColorOutput "=============================" "Blue"
    Write-ColorOutput "This will generate sustained load to trigger auto-scaling" "Yellow"
    Write-ColorOutput "Press Ctrl+C to stop" "Yellow"
    Write-ColorOutput "" "White"
    
    $requestCount = 0
    
    try {
        while ($true) {
            # Generate burst of requests
            for ($i = 0; $i -lt 20; $i++) {
                $job = Start-Job -ScriptBlock {
                    param($Url, $Headers)
                    try {
                        Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers -TimeoutSec 5 | Out-Null
                        return $true
                    }
                    catch {
                        return $false
                    }
                } -ArgumentList "$KONG_PROXY_URL/street-noshery/customer", $headers
                
                $requestCount++
            }
            
            # Wait for jobs to complete
            $jobs = Get-Job
            $jobs | Receive-Job -Wait -AutoRemoveJob | Out-Null
            
            Write-ColorOutput "📊 Sent $requestCount requests - Time: $(Get-Date -Format 'HH:mm:ss')" "Cyan"
            
            # Short pause between bursts
            Start-Sleep -Milliseconds 200
        }
    }
    catch {
        Write-ColorOutput "`n🛑 Load test stopped by user" "Yellow"
        Write-ColorOutput "Total requests sent: $requestCount" "White"
    }
}

# Main execution
Write-ColorOutput "🎯 Kong Load Test Script" "Blue"
Write-ColorOutput "========================" "Blue"
Write-ColorOutput "Choose test type:" "White"
Write-ColorOutput "1. Simple sustained load (recommended for auto-scaling test)" "White"
Write-ColorOutput "2. Timed load test ($Duration seconds)" "White"
Write-ColorOutput "" "White"

$choice = Read-Host "Enter choice (1 or 2)"

switch ($choice) {
    "1" {
        Start-SimpleLoadTest
    }
    "2" {
        Start-LoadTest
    }
    default {
        Write-ColorOutput "Invalid choice. Starting simple load test..." "Yellow"
        Start-SimpleLoadTest
    }
}
