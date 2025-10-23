# Kong Auto-Scaling Script for Street Noshery Project
# This script monitors load metrics and dynamically scales backend services from 3 to 6 instances

param(
    [int]$MinInstances = 3,
    [int]$MaxInstances = 6,
    [int]$ScaleUpThreshold = 80,    # CPU/Memory usage percentage to scale up
    [int]$ScaleDownThreshold = 30,  # CPU/Memory usage percentage to scale down
    [int]$CheckInterval = 30,       # Check interval in seconds
    [int]$CooldownPeriod = 300,     # Cooldown period in seconds (5 minutes)
    [switch]$DryRun,                # Show what would be done without executing
    [switch]$Verbose                # Verbose output
)

# Kong Admin API URL
$KONG_ADMIN_URL = "http://localhost:8001"
$DOCKER_COMPOSE_FILE = "docker-compose.yml"

# Global variables for state tracking
$script:LastScaleUpTime = 0
$script:LastScaleDownTime = 0
$script:CurrentInstances = 3
$script:ScalingHistory = @()

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
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
        Write-ColorOutput "❌ Kong is not accessible at $KONG_ADMIN_URL" $Colors.Red
        return $false
    }
}

function Get-BackendInstances {
    try {
        $response = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets" -Method Get -ErrorAction Stop
        return $response.data.Count
    }
    catch {
        Write-ColorOutput "❌ Failed to get backend instances: $($_.Exception.Message)" $Colors.Red
        return 0
    }
}

function Get-SystemMetrics {
    # Get Docker container metrics
    $metrics = @{
        CPU = 0
        Memory = 0
        RequestRate = 0
        ResponseTime = 0
    }
    
    try {
        # Get container stats for backend instances
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        
        $totalCpu = 0
        $totalMemory = 0
        $containerCount = 0
        
        foreach ($container in $containers) {
            $stats = docker stats $container --no-stream --format "{{.CPUPerc}},{{.MemPerc}}"
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
        
        # Get Kong metrics for request rate and response time
        try {
            $kongMetrics = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/metrics" -Method Get -ErrorAction Stop
            # Parse Prometheus metrics if available
            $metrics.RequestRate = Get-RequestRateFromMetrics $kongMetrics
            $metrics.ResponseTime = Get-ResponseTimeFromMetrics $kongMetrics
        }
        catch {
            # Fallback to basic health check
            $metrics.RequestRate = Get-BasicRequestRate
        }
    }
    catch {
        Write-ColorOutput "⚠️  Failed to get system metrics: $($_.Exception.Message)" $Colors.Yellow
    }
    
    return $metrics
}

function Get-RequestRateFromMetrics {
    param([string]$metricsData)
    
    # Simple parsing of Prometheus metrics
    # This would need to be adapted based on actual Kong metrics format
    $lines = $metricsData -split "`n"
    foreach ($line in $lines) {
        if ($line -match "kong_http_requests_total") {
            # Extract request rate (simplified)
            return 100  # Placeholder
        }
    }
    return 0
}

function Get-ResponseTimeFromMetrics {
    param([string]$metricsData)
    
    $lines = $metricsData -split "`n"
    foreach ($line in $lines) {
        if ($line -match "kong_request_latency_ms") {
            # Extract response time (simplified)
            return 50  # Placeholder
        }
    }
    return 0
}

function Get-BasicRequestRate {
    # Fallback method to estimate request rate
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        # Simple heuristic: if response time is high, assume high load
        if ($responseTime -gt 1000) { return 200 }
        elseif ($responseTime -gt 500) { return 150 }
        elseif ($responseTime -gt 200) { return 100 }
        else { return 50 }
    }
    catch {
        return 0
    }
}

function Should-ScaleUp {
    param($metrics)
    
    $currentTime = Get-CurrentTimestamp
    
    # Check cooldown period
    if (($currentTime - $script:LastScaleUpTime) -lt $CooldownPeriod) {
        return $false
    }
    
    # Check if already at max instances
    if ($script:CurrentInstances -ge $MaxInstances) {
        return $false
    }
    
    # Check scaling conditions
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
        Write-ColorOutput "📈 Scale up conditions met: $($reasons -join ', ')" $Colors.Yellow
    }
    
    return $shouldScale
}

function Should-ScaleDown {
    param($metrics)
    
    $currentTime = Get-CurrentTimestamp
    
    # Check cooldown period
    if (($currentTime - $script:LastScaleDownTime) -lt $CooldownPeriod) {
        return $false
    }
    
    # Check if already at min instances
    if ($script:CurrentInstances -le $MinInstances) {
        return $false
    }
    
    # Check scaling conditions
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
        Write-ColorOutput "📉 Scale down conditions met: Low load detected" $Colors.Cyan
    } else {
        if ($Verbose) {
            Write-ColorOutput "📊 Scale down blocked: $($reasons -join ', ')" $Colors.Yellow
        }
    }
    
    return $shouldScale
}

function Add-BackendInstance {
    param([int]$InstanceNumber)
    
    $containerName = "street-noshery-backend-$InstanceNumber"
    $port = 3019 + $InstanceNumber  # Ports: 3020, 3021, 3022, 3023, 3024, 3025
    
    Write-ColorOutput "🚀 Adding backend instance $InstanceNumber..." $Colors.Blue
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would add container: $containerName on port $port" $Colors.Magenta
        return $true
    }
    
    try {
        # Start the new container
        $envVars = @(
            "NODE_ENV=production",
            "PORT=3020",
            "GLOBAL_PREFIX=street-noshery",
            "INSTANCE_ID=backend-$InstanceNumber",
            "MONGO_URL=mongodb+srv://streetnoshery:Sumit%40Godwan%401062@streetnoshery.g7ufm.mongodb.net/street_noshery?retryWrites=true&w=majority"
        )
        
        $dockerArgs = @(
            "run", "-d",
            "--name", $containerName,
            "--network", "backend_street_noshery_kong-network",
            "--restart", "unless-stopped",
            "-p", "$port`:3020"
        )
        
        foreach ($envVar in $envVars) {
            $dockerArgs += "-e", $envVar
        }
        
        $dockerArgs += "backend_street_noshery_backend-1"  # Use the same image
        
        & docker @dockerArgs
        
        # Wait for container to be ready
        Start-Sleep -Seconds 10
        
        # Add target to Kong upstream
        $targetData = @{
            target = "$containerName`:3020"
            weight = 100
        }
        
        Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets" -Method Post -Body $targetData -ContentType "application/x-www-form-urlencoded"
        
        Write-ColorOutput "✅ Successfully added backend instance $InstanceNumber" $Colors.Green
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to add backend instance $InstanceNumber`: $($_.Exception.Message)" $Colors.Red
        return $false
    }
}

function Remove-BackendInstance {
    param([int]$InstanceNumber)
    
    $containerName = "street-noshery-backend-$InstanceNumber"
    
    Write-ColorOutput "🗑️  Removing backend instance $InstanceNumber..." $Colors.Blue
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would remove container: $containerName" $Colors.Magenta
        return $true
    }
    
    try {
        # Remove target from Kong upstream first
        $targets = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets" -Method Get
        foreach ($target in $targets.data) {
            if ($target.target -eq "$containerName`:3020") {
                Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets/$($target.id)" -Method Delete
                break
            }
        }
        
        # Stop and remove container
        docker stop $containerName
        docker rm $containerName
        
        Write-ColorOutput "✅ Successfully removed backend instance $InstanceNumber" $Colors.Green
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to remove backend instance $InstanceNumber`: $($_.Exception.Message)" $Colors.Red
        return $false
    }
}

function Update-ScalingHistory {
    param(
        [string]$Action,
        [int]$FromInstances,
        [int]$ToInstances,
        [hashtable]$Metrics
    )
    
    $historyEntry = @{
        Timestamp = Get-CurrentTimestamp
        Action = $Action
        FromInstances = $FromInstances
        ToInstances = $ToInstances
        CPU = $Metrics.CPU
        Memory = $Metrics.Memory
        RequestRate = $Metrics.RequestRate
        ResponseTime = $Metrics.ResponseTime
    }
    
    $script:ScalingHistory += $historyEntry
    
    # Keep only last 50 entries
    if ($script:ScalingHistory.Count -gt 50) {
        $script:ScalingHistory = $script:ScalingHistory[-50..-1]
    }
}

function Show-Metrics {
    param($metrics)
    
    Write-ColorOutput "📊 Current Metrics:" $Colors.Cyan
    Write-ColorOutput "   CPU Usage: $([math]::Round($metrics.CPU, 2))%" $Colors.White
    Write-ColorOutput "   Memory Usage: $([math]::Round($metrics.Memory, 2))%" $Colors.White
    Write-ColorOutput "   Request Rate: $($metrics.RequestRate)" $Colors.White
    Write-ColorOutput "   Response Time: $($metrics.ResponseTime)ms" $Colors.White
    Write-ColorOutput "   Current Instances: $script:CurrentInstances" $Colors.White
}

function Show-ScalingHistory {
    Write-ColorOutput "📈 Scaling History (Last 10 actions):" $Colors.Cyan
    
    $recentHistory = $script:ScalingHistory[-10..-1]
    foreach ($entry in $recentHistory) {
        $timestamp = [DateTimeOffset]::FromUnixTimeSeconds($entry.Timestamp).ToString("HH:mm:ss")
        Write-ColorOutput "   $timestamp - $($entry.Action): $($entry.FromInstances) → $($entry.ToInstances) instances" $Colors.White
    }
}

function Main {
    Write-ColorOutput "🚀 Kong Auto-Scaling Service Started" $Colors.Blue
    Write-ColorOutput "=====================================" $Colors.Blue
    Write-ColorOutput "Min Instances: $MinInstances" $Colors.White
    Write-ColorOutput "Max Instances: $MaxInstances" $Colors.White
    Write-ColorOutput "Scale Up Threshold: $ScaleUpThreshold%" $Colors.White
    Write-ColorOutput "Scale Down Threshold: $ScaleDownThreshold%" $Colors.White
    Write-ColorOutput "Check Interval: $CheckInterval seconds" $Colors.White
    Write-ColorOutput "Cooldown Period: $CooldownPeriod seconds" $Colors.White
    
    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN MODE - No actual changes will be made" $Colors.Magenta
    }
    
    Write-ColorOutput "" $Colors.White
    
    # Initialize current instance count
    $script:CurrentInstances = Get-BackendInstances
    Write-ColorOutput "Current backend instances: $script:CurrentInstances" $Colors.Green
    
    while ($true) {
        try {
            if (-not (Test-KongStatus)) {
                Write-ColorOutput "❌ Kong is not accessible. Waiting for Kong to be available..." $Colors.Red
                Start-Sleep -Seconds $CheckInterval
                continue
            }
            
            # Get current metrics
            $metrics = Get-SystemMetrics
            
            if ($Verbose) {
                Show-Metrics $metrics
            }
            
            # Check if we should scale up
            if (Should-ScaleUp $metrics) {
                $newInstanceNumber = $script:CurrentInstances + 1
                if (Add-BackendInstance $newInstanceNumber) {
                    $script:CurrentInstances++
                    $script:LastScaleUpTime = Get-CurrentTimestamp
                    Update-ScalingHistory "SCALE_UP" ($script:CurrentInstances - 1) $script:CurrentInstances $metrics
                    Write-ColorOutput "📈 Scaled up to $script:CurrentInstances instances" $Colors.Green
                }
            }
            # Check if we should scale down
            elseif (Should-ScaleDown $metrics) {
                $instanceToRemove = $script:CurrentInstances
                if (Remove-BackendInstance $instanceToRemove) {
                    $script:CurrentInstances--
                    $script:LastScaleDownTime = Get-CurrentTimestamp
                    Update-ScalingHistory "SCALE_DOWN" ($script:CurrentInstances + 1) $script:CurrentInstances $metrics
                    Write-ColorOutput "📉 Scaled down to $script:CurrentInstances instances" $Colors.Green
                }
            }
            else {
                if ($Verbose) {
                    Write-ColorOutput "📊 No scaling action needed" $Colors.Cyan
                }
            }
            
            # Show scaling history every 10 iterations
            if ($script:ScalingHistory.Count % 10 -eq 0 -and $script:ScalingHistory.Count -gt 0) {
                Show-ScalingHistory
            }
            
        }
        catch {
            Write-ColorOutput "❌ Error in main loop: $($_.Exception.Message)" $Colors.Red
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-ColorOutput "`n🛑 Auto-scaling service stopped" $Colors.Yellow
    Show-ScalingHistory
}

# Run the main function
Main
