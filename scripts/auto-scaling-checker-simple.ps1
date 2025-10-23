# Simple Auto-Scaling Status Checker
param(
    [int]$CheckInterval = 5,
    [int]$Duration = 60,
    [switch]$Continuous
)

$KONG_ADMIN_URL = "http://localhost:8001"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-SystemMetrics {
    $metrics = @{
        CPU = 0
        Memory = 0
        InstanceCount = 0
        Timestamp = Get-Date
    }
    
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        $metrics.InstanceCount = $containers.Count
        
        $totalCpu = 0
        $totalMemory = 0
        $containerCount = 0
        
        foreach ($container in $containers) {
            $stats = docker stats $container --no-stream --format "{{.CPUPerc}},{{.MemPerc}}" 2>$null
            if ($stats) {
                $parts = $stats.Split(',')
                $cpu = [double]($parts[0] -replace '%', '')
                $memory = [double]($parts[1] -replace '%', '')
                
                $totalCpu += $cpu
                $totalMemory += $memory
                $containerCount++
            }
        }
        
        if ($containerCount -gt 0) {
            $metrics.CPU = [math]::Round($totalCpu / $containerCount, 2)
            $metrics.Memory = [math]::Round($totalMemory / $containerCount, 2)
        }
    }
    catch {
        Write-ColorOutput "⚠️  Error getting metrics: $($_.Exception.Message)" "Yellow"
    }
    
    return $metrics
}

function Test-AutoScalingTriggers {
    $metrics = Get-SystemMetrics
    
    Write-ColorOutput "🔍 Auto-Scaling Trigger Analysis" "Cyan"
    Write-ColorOutput "=================================" "Cyan"
    Write-ColorOutput "Current Instances: $($metrics.InstanceCount)" "White"
    Write-ColorOutput "Average CPU: $($metrics.CPU)%" "White"
    Write-ColorOutput "Average Memory: $($metrics.Memory)%" "White"
    Write-ColorOutput "Timestamp: $($metrics.Timestamp)" "White"
    Write-ColorOutput ""
    
    # Check scale-up conditions
    Write-ColorOutput "📈 Scale-Up Conditions:" "Yellow"
    $scaleUpReasons = @()
    if ($metrics.CPU -gt 80) { $scaleUpReasons += "CPU greater than 80%" }
    if ($metrics.Memory -gt 80) { $scaleUpReasons += "Memory greater than 80%" }
    if ($metrics.InstanceCount -lt 6) { $scaleUpReasons += "Can scale up (current: $($metrics.InstanceCount)/6)" }
    
    if ($scaleUpReasons.Count -gt 0) {
        Write-ColorOutput "  ✅ Would trigger scale-up: $($scaleUpReasons -join ', ')" "Green"
    } else {
        Write-ColorOutput "  ❌ Would NOT trigger scale-up" "Red"
    }
    
    # Check scale-down conditions
    Write-ColorOutput "📉 Scale-Down Conditions:" "Yellow"
    $scaleDownReasons = @()
    if ($metrics.CPU -lt 30) { $scaleDownReasons += "CPU less than 30%" }
    if ($metrics.Memory -lt 30) { $scaleDownReasons += "Memory less than 30%" }
    if ($metrics.InstanceCount -gt 3) { $scaleDownReasons += "Can scale down (current: $($metrics.InstanceCount)/3 min)" }
    
    if ($scaleDownReasons.Count -gt 0) {
        Write-ColorOutput "  ✅ Would trigger scale-down: $($scaleDownReasons -join ', ')" "Green"
    } else {
        Write-ColorOutput "  ❌ Would NOT trigger scale-down" "Red"
    }
    
    Write-ColorOutput ""
}

function Show-ContainerStatus {
    Write-ColorOutput "📊 Container Status" "Cyan"
    Write-ColorOutput "===================" "Cyan"
    
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-ColorOutput $containers "White"
    }
    catch {
        Write-ColorOutput "❌ Error getting container status" "Red"
    }
    
    Write-ColorOutput ""
}

function Test-LoadGeneration {
    Write-ColorOutput "🚀 Testing Load Generation" "Blue"
    Write-ColorOutput "===========================" "Blue"
    
    $headers = @{ apikey = "web-api-key-12345" }
    $successCount = 0
    $totalRequests = 10
    
    Write-ColorOutput "Sending $totalRequests requests to Kong..." "Yellow"
    
    for ($i = 1; $i -le $totalRequests; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8000/street-noshery/customer" -Method Get -Headers $headers -TimeoutSec 5
            $successCount++
            Write-ColorOutput "Request $i`: ✅ Success" "Green"
        }
        catch {
            Write-ColorOutput "Request $i`: ❌ Failed" "Red"
        }
    }
    
    $successRate = [math]::Round(($successCount / $totalRequests) * 100, 2)
    Write-ColorOutput "Success Rate: $successRate%" "White"
    Write-ColorOutput ""
}

function Monitor-AutoScaling {
    param([int]$Duration)
    
    Write-ColorOutput "🔄 Monitoring Auto-Scaling Activity" "Blue"
    Write-ColorOutput "====================================" "Blue"
    Write-ColorOutput "Duration: $Duration seconds" "White"
    Write-ColorOutput "Check Interval: $CheckInterval seconds" "White"
    Write-ColorOutput ""
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($Duration)
    $previousInstanceCount = 0
    $scalingEvents = @()
    
    while ((Get-Date) -lt $endTime) {
        $metrics = Get-SystemMetrics
        
        if ($metrics.InstanceCount -ne $previousInstanceCount) {
            $event = @{
                Timestamp = $metrics.Timestamp
                FromCount = $previousInstanceCount
                ToCount = $metrics.InstanceCount
                CPU = $metrics.CPU
                Memory = $metrics.Memory
            }
            $scalingEvents += $event
            
            $action = if ($metrics.InstanceCount -gt $previousInstanceCount) { "SCALED UP" } else { "SCALED DOWN" }
            Write-ColorOutput "🎯 $action`: $($previousInstanceCount) → $($metrics.InstanceCount) instances" "Magenta"
            Write-ColorOutput "   CPU: $($metrics.CPU)%, Memory: $($metrics.Memory)%" "White"
        }
        
        $previousInstanceCount = $metrics.InstanceCount
        
        $elapsed = [math]::Round(($Duration - ($endTime - (Get-Date)).TotalSeconds), 1)
        $progress = [math]::Round(($elapsed / $Duration) * 100, 1)
        
        Write-ColorOutput "⏱️  Progress: $progress% | Instances: $($metrics.InstanceCount) | CPU: $($metrics.CPU)% | Memory: $($metrics.Memory)%" "Cyan"
        
        Start-Sleep -Seconds $CheckInterval
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "📈 Scaling Events Summary:" "Blue"
    Write-ColorOutput "=========================" "Blue"
    
    if ($scalingEvents.Count -gt 0) {
        foreach ($event in $scalingEvents) {
            $action = if ($event.ToCount -gt $event.FromCount) { "SCALED UP" } else { "SCALED DOWN" }
            Write-ColorOutput "$($event.Timestamp.ToString('HH:mm:ss')) - $action`: $($event.FromCount) → $($event.ToCount) instances" "White"
        }
    } else {
        Write-ColorOutput "No scaling events detected during monitoring period" "Yellow"
    }
}

function Show-AutoScalingStatus {
    Write-ColorOutput "🎯 Auto-Scaling Status Check" "Blue"
    Write-ColorOutput "============================" "Blue"
    Write-ColorOutput ""
    
    # Check if Kong is running
    try {
        $kongStatus = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -TimeoutSec 5
        Write-ColorOutput "✅ Kong Gateway: Running" "Green"
    }
    catch {
        Write-ColorOutput "❌ Kong Gateway: Not accessible" "Red"
        return
    }
    
    # Check backend instances
    Show-ContainerStatus
    
    # Analyze scaling triggers
    Test-AutoScalingTriggers
    
    # Test load generation
    Test-LoadGeneration
    
    # Check Kong upstream targets
    try {
        $upstreams = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams" -Method Get
        $streetNosheryUpstream = $upstreams.data | Where-Object { $_.name -eq "street-noshery-upstream" }
        
        if ($streetNosheryUpstream) {
            $targets = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams/$($streetNosheryUpstream.id)/targets" -Method Get
            Write-ColorOutput "🎯 Kong Upstream Targets:" "Cyan"
            foreach ($target in $targets.data) {
                $healthColor = switch ($target.health) {
                    "HEALTHY" { "Green" }
                    "UNHEALTHY" { "Red" }
                    default { "Yellow" }
                }
                Write-ColorOutput "  $($target.target) - Weight: $($target.weight) - Health: $($target.health)" $healthColor
            }
        }
    }
    catch {
        Write-ColorOutput "⚠️  Could not fetch Kong upstream targets" "Yellow"
    }
    
    Write-ColorOutput ""
}

function Main {
    Write-ColorOutput "🔍 Kong Auto-Scaling Status Checker" "Blue"
    Write-ColorOutput "====================================" "Blue"
    Write-ColorOutput ""
    
    if ($Continuous) {
        Monitor-AutoScaling $Duration
    } else {
        Show-AutoScalingStatus
        
        Write-ColorOutput "💡 Tips to Test Auto-Scaling:" "Yellow"
        Write-ColorOutput "1. Start auto-scaling script: .\scripts\kong-auto-scaling-test.ps1 -Verbose" "White"
        Write-ColorOutput "2. Generate load: .\scripts\load-test.ps1" "White"
        Write-ColorOutput "3. Monitor continuously: .\scripts\auto-scaling-checker.ps1 -Continuous -Duration 120" "White"
        Write-ColorOutput "4. Check this status again: .\scripts\auto-scaling-checker.ps1" "White"
    }
}

# Run the main function
Main
