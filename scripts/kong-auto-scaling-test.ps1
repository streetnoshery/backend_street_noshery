# Simple Kong Auto-Scaling Script for Testing
param(
    [int]$MinInstances = 3,
    [int]$MaxInstances = 6,
    [int]$ScaleUpThreshold = 80,
    [int]$ScaleDownThreshold = 30,
    [int]$CheckInterval = 30,
    [int]$CooldownPeriod = 300,
    [switch]$DryRun,
    [switch]$Verbose
)

$KONG_ADMIN_URL = "http://localhost:8001"
$script:LastScaleUpTime = 0
$script:LastScaleDownTime = 0
$script:CurrentInstances = 3

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-CurrentTimestamp {
    return [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
}

function Test-KongStatus {
    try {
        $response = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -ErrorAction Stop
        return $true
    }
    catch {
        Write-ColorOutput "❌ Kong is not accessible at $KONG_ADMIN_URL" "Red"
        return $false
    }
}

function Get-BackendInstances {
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        return $containers.Count
    }
    catch {
        Write-ColorOutput "❌ Failed to get backend instances: $($_.Exception.Message)" "Red"
        return 0
    }
}

function Get-SystemMetrics {
    $metrics = @{
        CPU = 0
        Memory = 0
        RequestRate = 0
        ResponseTime = 0
    }
    
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
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
            $metrics.CPU = $totalCpu / $containerCount
            $metrics.Memory = $totalMemory / $containerCount
        }
        
        # Simulate load for testing
        $metrics.RequestRate = 200  # High load to trigger scaling
        $metrics.ResponseTime = 1500  # High response time
        
    }
    catch {
        Write-ColorOutput "⚠️  Failed to get system metrics: $($_.Exception.Message)" "Yellow"
    }
    
    return $metrics
}

function Should-ScaleUp {
    param($metrics)
    
    $currentTime = Get-CurrentTimestamp
    
    if (($currentTime - $script:LastScaleUpTime) -lt $CooldownPeriod) {
        return $false
    }
    
    if ($script:CurrentInstances -ge $MaxInstances) {
        return $false
    }
    
    $shouldScale = $false
    $reasons = @()
    
    if ($metrics.CPU -gt $ScaleUpThreshold) {
        $shouldScale = $true
        $reasons += "CPU usage: $([math]::Round($metrics.CPU, 2))%"
    }
    
    if ($metrics.Memory -gt $ScaleUpThreshold) {
        $shouldScale = $true
        $reasons += "Memory usage: $([math]::Round($metrics.Memory, 2))%"
    }
    
    if ($metrics.RequestRate -gt 150) {
        $shouldScale = $true
        $reasons += "Request rate: $($metrics.RequestRate)"
    }
    
    if ($metrics.ResponseTime -gt 1000) {
        $shouldScale = $true
        $reasons += "Response time: $($metrics.ResponseTime)ms"
    }
    
    if ($shouldScale) {
        Write-ColorOutput "📈 Scale up conditions met: $($reasons -join ', ')" "Yellow"
    }
    
    return $shouldScale
}

function Should-ScaleDown {
    param($metrics)
    
    $currentTime = Get-CurrentTimestamp
    
    if (($currentTime - $script:LastScaleDownTime) -lt $CooldownPeriod) {
        return $false
    }
    
    if ($script:CurrentInstances -le $MinInstances) {
        return $false
    }
    
    $shouldScale = $true
    $reasons = @()
    
    if ($metrics.CPU -gt $ScaleDownThreshold) {
        $shouldScale = $false
        $reasons += "CPU usage: $([math]::Round($metrics.CPU, 2))%"
    }
    
    if ($metrics.Memory -gt $ScaleDownThreshold) {
        $shouldScale = $false
        $reasons += "Memory usage: $([math]::Round($metrics.Memory, 2))%"
    }
    
    if ($metrics.RequestRate -gt 50) {
        $shouldScale = $false
        $reasons += "Request rate: $($metrics.RequestRate)"
    }
    
    if ($shouldScale) {
        Write-ColorOutput "📉 Scale down conditions met: Low load detected" "Cyan"
    } else {
        if ($Verbose) {
            Write-ColorOutput "📊 Scale down blocked: $($reasons -join ', ')" "Yellow"
        }
    }
    
    return $shouldScale
}

function Add-BackendInstance {
    param([int]$InstanceNumber)
    
    $containerName = "street-noshery-backend-$InstanceNumber"
    $port = 3019 + $InstanceNumber
    
    Write-ColorOutput "🚀 Adding backend instance $InstanceNumber..." "Blue"
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would add container: $containerName on port $port" "Magenta"
        return $true
    }
    
    try {
        docker-compose up -d "backend-$InstanceNumber"
        Start-Sleep -Seconds 10
        
        Write-ColorOutput "✅ Successfully added backend instance $InstanceNumber" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to add backend instance $InstanceNumber`: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Remove-BackendInstance {
    param([int]$InstanceNumber)
    
    $containerName = "street-noshery-backend-$InstanceNumber"
    
    Write-ColorOutput "🗑️  Removing backend instance $InstanceNumber..." "Blue"
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would remove container: $containerName" "Magenta"
        return $true
    }
    
    try {
        docker stop $containerName
        docker rm $containerName
        
        Write-ColorOutput "✅ Successfully removed backend instance $InstanceNumber" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to remove backend instance $InstanceNumber`: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Show-Metrics {
    param($metrics)
    
    Write-ColorOutput "📊 Current Metrics:" "Cyan"
    Write-ColorOutput "   CPU Usage: $([math]::Round($metrics.CPU, 2))%" "White"
    Write-ColorOutput "   Memory Usage: $([math]::Round($metrics.Memory, 2))%" "White"
    Write-ColorOutput "   Request Rate: $($metrics.RequestRate)" "White"
    Write-ColorOutput "   Response Time: $($metrics.ResponseTime)ms" "White"
    Write-ColorOutput "   Current Instances: $script:CurrentInstances" "White"
}

function Main {
    Write-ColorOutput "🚀 Kong Auto-Scaling Service Started" "Blue"
    Write-ColorOutput "=====================================" "Blue"
    Write-ColorOutput "Min Instances: $MinInstances" "White"
    Write-ColorOutput "Max Instances: $MaxInstances" "White"
    Write-ColorOutput "Scale Up Threshold: $ScaleUpThreshold%" "White"
    Write-ColorOutput "Scale Down Threshold: $ScaleDownThreshold%" "White"
    Write-ColorOutput "Check Interval: $CheckInterval seconds" "White"
    Write-ColorOutput "Cooldown Period: $CooldownPeriod seconds" "White"
    
    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN MODE - No actual changes will be made" "Magenta"
    }
    
    Write-ColorOutput "" "White"
    
    $script:CurrentInstances = Get-BackendInstances
    Write-ColorOutput "Current backend instances: $script:CurrentInstances" "Green"
    
    $iteration = 0
    while ($true) {
        $iteration++
        try {
            if (-not (Test-KongStatus)) {
                Write-ColorOutput "❌ Kong is not accessible. Waiting for Kong to be available..." "Red"
                Start-Sleep -Seconds $CheckInterval
                continue
            }
            
            $metrics = Get-SystemMetrics
            
            if ($Verbose) {
                Show-Metrics $metrics
            }
            
            if (Should-ScaleUp $metrics) {
                $newInstanceNumber = $script:CurrentInstances + 1
                if (Add-BackendInstance $newInstanceNumber) {
                    $script:CurrentInstances++
                    $script:LastScaleUpTime = Get-CurrentTimestamp
                    Write-ColorOutput "📈 Scaled up to $script:CurrentInstances instances" "Green"
                }
            }
            elseif (Should-ScaleDown $metrics) {
                $instanceToRemove = $script:CurrentInstances
                if (Remove-BackendInstance $instanceToRemove) {
                    $script:CurrentInstances--
                    $script:LastScaleDownTime = Get-CurrentTimestamp
                    Write-ColorOutput "📉 Scaled down to $script:CurrentInstances instances" "Green"
                }
            }
            else {
                if ($Verbose) {
                    Write-ColorOutput "📊 No scaling action needed" "Cyan"
                }
            }
            
            Write-ColorOutput "Iteration $iteration - Instances: $script:CurrentInstances - Press Ctrl+C to stop" "Yellow"
            
        }
        catch {
            Write-ColorOutput "❌ Error in main loop: $($_.Exception.Message)" "Red"
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-ColorOutput "`n🛑 Auto-scaling service stopped" "Yellow"
}

# Run the main function
Main
