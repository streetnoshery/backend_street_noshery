# Simple Auto-Scaling Status Checker
param(
    [switch]$Continuous,
    [int]$Duration = 60
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-ContainerCount {
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        return $containers.Count
    }
    catch {
        return 0
    }
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
        Write-ColorOutput "Error getting metrics: $($_.Exception.Message)" "Yellow"
    }
    
    return $metrics
}

function Show-Status {
    Write-ColorOutput "🎯 Auto-Scaling Status Check" "Blue"
    Write-ColorOutput "============================" "Blue"
    Write-ColorOutput ""
    
    # Check Kong
    try {
        $kongStatus = Invoke-RestMethod -Uri "http://localhost:8001/status" -Method Get -TimeoutSec 5
        Write-ColorOutput "✅ Kong Gateway: Running" "Green"
    }
    catch {
        Write-ColorOutput "❌ Kong Gateway: Not accessible" "Red"
        return
    }
    
    # Show containers
    Write-ColorOutput "📊 Backend Containers:" "Cyan"
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-ColorOutput $containers "White"
    }
    catch {
        Write-ColorOutput "Error getting container status" "Red"
    }
    
    # Get metrics
    $metrics = Get-SystemMetrics
    Write-ColorOutput ""
    Write-ColorOutput "📈 Current Metrics:" "Cyan"
    Write-ColorOutput "  Instances: $($metrics.InstanceCount)" "White"
    Write-ColorOutput "  CPU Usage: $($metrics.CPU)%" "White"
    Write-ColorOutput "  Memory Usage: $($metrics.Memory)%" "White"
    Write-ColorOutput "  Timestamp: $($metrics.Timestamp)" "White"
    Write-ColorOutput ""
    
    # Check scaling conditions
    Write-ColorOutput "🔍 Scaling Analysis:" "Yellow"
    
    # Scale up conditions
    $scaleUpReasons = @()
    if ($metrics.CPU -gt 80) { $scaleUpReasons += "CPU > 80%" }
    if ($metrics.Memory -gt 80) { $scaleUpReasons += "Memory > 80%" }
    if ($metrics.InstanceCount -lt 6) { $scaleUpReasons += "Can scale up" }
    
    if ($scaleUpReasons.Count -gt 0) {
        Write-ColorOutput "  📈 Would scale UP: $($scaleUpReasons -join ', ')" "Green"
    } else {
        Write-ColorOutput "  📈 Would NOT scale up" "Red"
    }
    
    # Scale down conditions
    $scaleDownReasons = @()
    if ($metrics.CPU -lt 30) { $scaleDownReasons += "CPU < 30%" }
    if ($metrics.Memory -lt 30) { $scaleDownReasons += "Memory < 30%" }
    if ($metrics.InstanceCount -gt 3) { $scaleDownReasons += "Can scale down" }
    
    if ($scaleDownReasons.Count -gt 0) {
        Write-ColorOutput "  📉 Would scale DOWN: $($scaleDownReasons -join ', ')" "Green"
    } else {
        Write-ColorOutput "  📉 Would NOT scale down" "Red"
    }
    
    Write-ColorOutput ""
    
    # Test Kong load balancing
    Write-ColorOutput "🚀 Testing Kong Load Balancing:" "Blue"
    $headers = @{ apikey = "web-api-key-12345" }
    $successCount = 0
    
    for ($i = 1; $i -le 5; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8000/street-noshery/customer" -Method Get -Headers $headers -TimeoutSec 5
            $successCount++
            Write-ColorOutput "  Request $i`: ✅ Success" "Green"
        }
        catch {
            Write-ColorOutput "  Request $i`: ❌ Failed" "Red"
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "💡 To Test Auto-Scaling:" "Yellow"
    Write-ColorOutput "1. Start auto-scaling: .\scripts\kong-auto-scaling-test.ps1 -Verbose" "White"
    Write-ColorOutput "2. Generate load: .\scripts\load-test.ps1" "White"
    Write-ColorOutput "3. Monitor: .\scripts\auto-scaling-checker-simple.ps1 -Continuous" "White"
}

function Monitor-Continuous {
    Write-ColorOutput "🔄 Continuous Monitoring Started" "Blue"
    Write-ColorOutput "Duration: $Duration seconds" "White"
    Write-ColorOutput "Press Ctrl+C to stop" "Yellow"
    Write-ColorOutput ""
    
    $previousCount = 0
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($Duration)
    
    while ((Get-Date) -lt $endTime) {
        $currentCount = Get-ContainerCount
        $metrics = Get-SystemMetrics
        
        if ($currentCount -ne $previousCount) {
            $action = if ($currentCount -gt $previousCount) { "SCALED UP" } else { "SCALED DOWN" }
            Write-ColorOutput "🎯 $action`: $previousCount → $currentCount instances" "Magenta"
            Write-ColorOutput "   CPU: $($metrics.CPU)%, Memory: $($metrics.Memory)%" "White"
        }
        
        $elapsed = [math]::Round(($Duration - ($endTime - (Get-Date)).TotalSeconds), 1)
        $progress = [math]::Round(($elapsed / $Duration) * 100, 1)
        
        Write-ColorOutput "⏱️  $progress% | Instances: $currentCount | CPU: $($metrics.CPU)% | Memory: $($metrics.Memory)%" "Cyan"
        
        $previousCount = $currentCount
        Start-Sleep -Seconds 5
    }
    
    Write-ColorOutput "Monitoring completed" "Green"
}

# Main execution
if ($Continuous) {
    Monitor-Continuous
} else {
    Show-Status
}
