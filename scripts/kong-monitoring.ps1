# Kong Load Monitoring Script for Street Noshery Project
# This script provides detailed monitoring of Kong load balancer and backend services

param(
    [int]$RefreshInterval = 5,     # Refresh interval in seconds
    [switch]$ExportToFile,          # Export metrics to file
    [string]$OutputFile = "kong-metrics.json",
    [switch]$ShowHistory,           # Show historical data
    [int]$HistoryDays = 7,         # Number of days of history to show
    [switch]$AlertMode,             # Enable alert mode for thresholds
    [int]$CpuThreshold = 80,       # CPU threshold for alerts
    [int]$MemoryThreshold = 80,   # Memory threshold for alerts
    [int]$ResponseTimeThreshold = 1000,  # Response time threshold in ms
    [switch]$Verbose               # Verbose output
)

# Kong Admin API URL
$KONG_ADMIN_URL = "http://localhost:8001"
$KONG_PROXY_URL = "http://localhost:8000"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
    White = "White"
}

# Global variables for metrics storage
$script:MetricsHistory = @()
$script:AlertHistory = @()

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

function Get-DateTimeString {
    return (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
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

function Get-KongMetrics {
    $metrics = @{
        Timestamp = Get-CurrentTimestamp
        DateTime = Get-DateTimeString
        Kong = @{}
        BackendServices = @()
        SystemMetrics = @{}
        HealthChecks = @{}
    }
    
    try {
        # Get Kong status
        $kongStatus = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -ErrorAction Stop
        $metrics.Kong = $kongStatus
        
        # Get Kong metrics (Prometheus format)
        try {
            $kongMetrics = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/metrics" -Method Get -ErrorAction Stop
            $metrics.Kong.Metrics = Parse-KongMetrics $kongMetrics
        }
        catch {
            Write-ColorOutput "⚠️  Could not fetch Kong metrics: $($_.Exception.Message)" $Colors.Yellow
        }
        
        # Get upstream targets
        try {
            $upstreams = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams" -Method Get -ErrorAction Stop
            foreach ($upstream in $upstreams.data) {
                if ($upstream.name -eq "street-noshery-upstream") {
                    $targets = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/upstreams/$($upstream.id)/targets" -Method Get -ErrorAction Stop
                    $metrics.Kong.UpstreamTargets = $targets.data
                }
            }
        }
        catch {
            Write-ColorOutput "⚠️  Could not fetch upstream targets: $($_.Exception.Message)" $Colors.Yellow
        }
        
        # Get backend service metrics
        $metrics.BackendServices = Get-BackendServiceMetrics
        
        # Get system metrics
        $metrics.SystemMetrics = Get-SystemMetrics
        
        # Get health check status
        $metrics.HealthChecks = Get-HealthCheckStatus
        
    }
    catch {
        Write-ColorOutput "❌ Error collecting Kong metrics: $($_.Exception.Message)" $Colors.Red
    }
    
    return $metrics
}

function Parse-KongMetrics {
    param([string]$metricsData)
    
    $parsedMetrics = @{
        RequestRate = 0
        ResponseTime = 0
        ErrorRate = 0
        ActiveConnections = 0
        TotalRequests = 0
    }
    
    $lines = $metricsData -split "`n"
    foreach ($line in $lines) {
        if ($line -match "kong_http_requests_total") {
            $parsedMetrics.TotalRequests = [int]($line -split " ")[1]
        }
        elseif ($line -match "kong_request_latency_ms") {
            $parsedMetrics.ResponseTime = [double]($line -split " ")[1]
        }
        elseif ($line -match "kong_http_requests_total.*5[0-9][0-9]") {
            $parsedMetrics.ErrorRate += [int]($line -split " ")[1]
        }
    }
    
    return $parsedMetrics
}

function Get-BackendServiceMetrics {
    $backendMetrics = @()
    
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        
        foreach ($container in $containers) {
            $containerMetrics = @{
                Name = $container
                Status = "Unknown"
                CPU = 0
                Memory = 0
                NetworkIn = 0
                NetworkOut = 0
                Uptime = 0
            }
            
            # Get container stats
            $stats = docker stats $container --no-stream --format "{{.CPUPerc}},{{.MemPerc}},{{.NetIO}}" 2>$null
            if ($stats) {
                $parts = $stats.Split(',')
                $containerMetrics.CPU = [double]($parts[0] -replace '%', '')
                $containerMetrics.Memory = [double]($parts[1] -replace '%', '')
                $containerMetrics.NetworkIn = $parts[2].Split('/')[0].Trim()
                $containerMetrics.NetworkOut = $parts[2].Split('/')[1].Trim()
            }
            
            # Get container uptime
            $inspect = docker inspect $container --format "{{.State.StartedAt}}" 2>$null
            if ($inspect) {
                $startTime = [DateTime]::Parse($inspect)
                $containerMetrics.Uptime = (Get-Date) - $startTime
            }
            
            # Get container status
            $status = docker inspect $container --format "{{.State.Status}}" 2>$null
            if ($status) {
                $containerMetrics.Status = $status
            }
            
            # Test health endpoint
            $port = Get-ContainerPort $container
            if ($port) {
                try {
                    $healthResponse = Invoke-RestMethod -Uri "http://localhost:$port/street-noshery/customer" -Method Get -TimeoutSec 5 -ErrorAction Stop
                    $containerMetrics.HealthStatus = "Healthy"
                }
                catch {
                    $containerMetrics.HealthStatus = "Unhealthy"
                }
            }
            
            $backendMetrics += $containerMetrics
        }
    }
    catch {
        Write-ColorOutput "⚠️  Error getting backend metrics: $($_.Exception.Message)" $Colors.Yellow
    }
    
    return $backendMetrics
}

function Get-ContainerPort {
    param([string]$containerName)
    
    try {
        $port = docker port $containerName 3020 2>$null
        if ($port) {
            return $port.Split(':')[0]
        }
    }
    catch {
        # Fallback to known ports
        switch ($containerName) {
            "street-noshery-backend-1" { return "3020" }
            "street-noshery-backend-2" { return "3021" }
            "street-noshery-backend-3" { return "3022" }
            "street-noshery-backend-4" { return "3023" }
            "street-noshery-backend-5" { return "3024" }
            "street-noshery-backend-6" { return "3025" }
        }
    }
    return $null
}

function Get-SystemMetrics {
    $systemMetrics = @{
        TotalCPU = 0
        TotalMemory = 0
        AvailableMemory = 0
        DiskUsage = 0
        LoadAverage = 0
    }
    
    try {
        # Get system CPU and memory info
        $systemInfo = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction Stop
        $systemMetrics.TotalMemory = [math]::Round($systemInfo.TotalVisibleMemorySize / 1MB, 2)
        $systemMetrics.AvailableMemory = [math]::Round($systemInfo.FreePhysicalMemory / 1MB, 2)
        
        # Get CPU usage
        $cpu = Get-WmiObject -Class Win32_Processor -ErrorAction Stop
        $systemMetrics.TotalCPU = $cpu.LoadPercentage
        
        # Get disk usage
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction Stop
        $systemMetrics.DiskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
        
    }
    catch {
        Write-ColorOutput "⚠️  Error getting system metrics: $($_.Exception.Message)" $Colors.Yellow
    }
    
    return $systemMetrics
}

function Get-HealthCheckStatus {
    $healthChecks = @{
        KongGateway = "Unknown"
        KongDatabase = "Unknown"
        BackendServices = @()
        OverallHealth = "Unknown"
    }
    
    try {
        # Check Kong Gateway
        $kongHealth = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -ErrorAction Stop
        $healthChecks.KongGateway = if ($kongHealth.server.connections_accepted -gt 0) { "Healthy" } else { "Unhealthy" }
        
        # Check Kong Database
        $dbHealth = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -ErrorAction Stop
        $healthChecks.KongDatabase = if ($dbHealth.database.reachable) { "Healthy" } else { "Unhealthy" }
        
        # Check Backend Services
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        foreach ($container in $containers) {
            $port = Get-ContainerPort $container
            if ($port) {
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:$port/street-noshery/customer" -Method Get -TimeoutSec 5 -ErrorAction Stop
                    $healthChecks.BackendServices += @{
                        Name = $container
                        Status = "Healthy"
                        ResponseTime = $response.ResponseTime
                    }
                }
                catch {
                    $healthChecks.BackendServices += @{
                        Name = $container
                        Status = "Unhealthy"
                        Error = $_.Exception.Message
                    }
                }
            }
        }
        
        # Determine overall health
        $unhealthyServices = ($healthChecks.BackendServices | Where-Object { $_.Status -eq "Unhealthy" }).Count
        if ($unhealthyServices -eq 0 -and $healthChecks.KongGateway -eq "Healthy") {
            $healthChecks.OverallHealth = "Healthy"
        }
        elseif ($unhealthyServices -lt ($healthChecks.BackendServices.Count / 2)) {
            $healthChecks.OverallHealth = "Degraded"
        }
        else {
            $healthChecks.OverallHealth = "Unhealthy"
        }
        
    }
    catch {
        Write-ColorOutput "⚠️  Error getting health check status: $($_.Exception.Message)" $Colors.Yellow
    }
    
    return $healthChecks
}

function Show-MetricsDashboard {
    param($metrics)
    
    Clear-Host
    
    Write-ColorOutput "🚀 Kong Load Balancer Monitoring Dashboard" $Colors.Blue
    Write-ColorOutput "=============================================" $Colors.Blue
    Write-ColorOutput "Last Updated: $($metrics.DateTime)" $Colors.Cyan
    Write-ColorOutput ""
    
    # Overall Health Status
    $healthColor = switch ($metrics.HealthChecks.OverallHealth) {
        "Healthy" { $Colors.Green }
        "Degraded" { $Colors.Yellow }
        "Unhealthy" { $Colors.Red }
        default { $Colors.White }
    }
    Write-ColorOutput "🏥 Overall Health: $($metrics.HealthChecks.OverallHealth)" $healthColor
    Write-ColorOutput ""
    
    # Kong Gateway Status
    Write-ColorOutput "🌐 Kong Gateway Status:" $Colors.Cyan
    Write-ColorOutput "   Status: $($metrics.Kong.server.state)" $Colors.White
    Write-ColorOutput "   Connections Accepted: $($metrics.Kong.server.connections_accepted)" $Colors.White
    Write-ColorOutput "   Connections Active: $($metrics.Kong.server.connections_active)" $Colors.White
    Write-ColorOutput "   Connections Handled: $($metrics.Kong.server.connections_handled)" $Colors.White
    Write-ColorOutput ""
    
    # Backend Services Status
    Write-ColorOutput "🔧 Backend Services:" $Colors.Cyan
    foreach ($service in $metrics.BackendServices) {
        $statusColor = switch ($service.Status) {
            "running" { $Colors.Green }
            "exited" { $Colors.Red }
            default { $Colors.Yellow }
        }
        $healthColor = switch ($service.HealthStatus) {
            "Healthy" { $Colors.Green }
            "Unhealthy" { $Colors.Red }
            default { $Colors.Yellow }
        }
        
        Write-ColorOutput "   $($service.Name):" $Colors.White
        Write-ColorOutput "     Status: $($service.Status)" $statusColor
        Write-ColorOutput "     Health: $($service.HealthStatus)" $healthColor
        Write-ColorOutput "     CPU: $([math]::Round($service.CPU, 2))%" $Colors.White
        Write-ColorOutput "     Memory: $([math]::Round($service.Memory, 2))%" $Colors.White
        Write-ColorOutput "     Uptime: $($service.Uptime.Days)d $($service.Uptime.Hours)h $($service.Uptime.Minutes)m" $Colors.White
        Write-ColorOutput ""
    }
    
    # System Metrics
    Write-ColorOutput "💻 System Metrics:" $Colors.Cyan
    Write-ColorOutput "   Total CPU Usage: $($metrics.SystemMetrics.TotalCPU)%" $Colors.White
    Write-ColorOutput "   Memory Usage: $([math]::Round(($metrics.SystemMetrics.TotalMemory - $metrics.SystemMetrics.AvailableMemory) / $metrics.SystemMetrics.TotalMemory * 100, 2))%" $Colors.White
    Write-ColorOutput "   Available Memory: $($metrics.SystemMetrics.AvailableMemory) MB" $Colors.White
    Write-ColorOutput "   Disk Usage: $($metrics.SystemMetrics.DiskUsage)%" $Colors.White
    Write-ColorOutput ""
    
    # Kong Metrics
    if ($metrics.Kong.Metrics) {
        Write-ColorOutput "📊 Kong Metrics:" $Colors.Cyan
        Write-ColorOutput "   Total Requests: $($metrics.Kong.Metrics.TotalRequests)" $Colors.White
        Write-ColorOutput "   Response Time: $($metrics.Kong.Metrics.ResponseTime)ms" $Colors.White
        Write-ColorOutput "   Error Rate: $($metrics.Kong.Metrics.ErrorRate)" $Colors.White
        Write-ColorOutput ""
    }
    
    # Upstream Targets
    if ($metrics.Kong.UpstreamTargets) {
        Write-ColorOutput "🎯 Upstream Targets:" $Colors.Cyan
        foreach ($target in $metrics.Kong.UpstreamTargets) {
            $targetColor = switch ($target.health) {
                "HEALTHY" { $Colors.Green }
                "UNHEALTHY" { $Colors.Red }
                default { $Colors.Yellow }
            }
            Write-ColorOutput "   $($target.target) - Weight: $($target.weight) - Health: $($target.health)" $targetColor
        }
        Write-ColorOutput ""
    }
    
    # Alerts
    if ($AlertMode) {
        Show-Alerts $metrics
    }
    
    Write-ColorOutput "Press Ctrl+C to exit" $Colors.Yellow
}

function Show-Alerts {
    param($metrics)
    
    $alerts = @()
    
    # Check CPU thresholds
    foreach ($service in $metrics.BackendServices) {
        if ($service.CPU -gt $CpuThreshold) {
            $alerts += "⚠️  High CPU usage on $($service.Name): $([math]::Round($service.CPU, 2))%"
        }
    }
    
    # Check Memory thresholds
    foreach ($service in $metrics.BackendServices) {
        if ($service.Memory -gt $MemoryThreshold) {
            $alerts += "⚠️  High Memory usage on $($service.Name): $([math]::Round($service.Memory, 2))%"
        }
    }
    
    # Check Response Time
    if ($metrics.Kong.Metrics.ResponseTime -gt $ResponseTimeThreshold) {
        $alerts += "⚠️  High Response Time: $($metrics.Kong.Metrics.ResponseTime)ms"
    }
    
    # Check Health Status
    if ($metrics.HealthChecks.OverallHealth -ne "Healthy") {
        $alerts += "🚨 Overall Health Status: $($metrics.HealthChecks.OverallHealth)"
    }
    
    if ($alerts.Count -gt 0) {
        Write-ColorOutput "🚨 ALERTS:" $Colors.Red
        foreach ($alert in $alerts) {
            Write-ColorOutput "   $alert" $Colors.Red
        }
        Write-ColorOutput ""
        
        # Store alert in history
        $script:AlertHistory += @{
            Timestamp = Get-CurrentTimestamp
            DateTime = Get-DateTimeString
            Alerts = $alerts
        }
    }
}

function Export-MetricsToFile {
    param($metrics)
    
    try {
        $exportData = @{
            Timestamp = $metrics.Timestamp
            DateTime = $metrics.DateTime
            Metrics = $metrics
        }
        
        $jsonData = $exportData | ConvertTo-Json -Depth 10
        $jsonData | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        
        Write-ColorOutput "📁 Metrics exported to $OutputFile" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ Error exporting metrics: $($_.Exception.Message)" $Colors.Red
    }
}

function Show-History {
    param([int]$Days)
    
    Write-ColorOutput "📈 Historical Metrics (Last $Days days)" $Colors.Blue
    Write-ColorOutput "=======================================" $Colors.Blue
    
    if ($script:MetricsHistory.Count -eq 0) {
        Write-ColorOutput "No historical data available" $Colors.Yellow
        return
    }
    
    $cutoffTime = (Get-CurrentTimestamp) - ($Days * 24 * 60 * 60)
    $filteredHistory = $script:MetricsHistory | Where-Object { $_.Timestamp -gt $cutoffTime }
    
    foreach ($metric in $filteredHistory) {
        Write-ColorOutput "$($metric.DateTime) - Instances: $($metric.BackendServices.Count) - Health: $($metric.HealthChecks.OverallHealth)" $Colors.White
    }
}

function Main {
    Write-ColorOutput "🚀 Kong Load Monitoring Service Started" $Colors.Blue
    Write-ColorOutput "========================================" $Colors.Blue
    Write-ColorOutput "Refresh Interval: $RefreshInterval seconds" $Colors.White
    Write-ColorOutput "Export to File: $ExportToFile" $Colors.White
    Write-ColorOutput "Alert Mode: $AlertMode" $Colors.White
    Write-ColorOutput ""
    
    if (-not (Test-KongStatus)) {
        Write-ColorOutput "❌ Kong is not accessible. Please start Kong first." $Colors.Red
        return
    }
    
    while ($true) {
        try {
            $metrics = Get-KongMetrics
            
            # Store metrics in history
            $script:MetricsHistory += $metrics
            
            # Keep only last 1000 entries
            if ($script:MetricsHistory.Count -gt 1000) {
                $script:MetricsHistory = $script:MetricsHistory[-1000..-1]
            }
            
            if ($ShowHistory) {
                Show-History $HistoryDays
                return
            }
            
            Show-MetricsDashboard $metrics
            
            if ($ExportToFile) {
                Export-MetricsToFile $metrics
            }
            
        }
        catch {
            Write-ColorOutput "❌ Error in monitoring loop: $($_.Exception.Message)" $Colors.Red
        }
        
        Start-Sleep -Seconds $RefreshInterval
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-ColorOutput "`n🛑 Monitoring service stopped" $Colors.Yellow
    if ($script:AlertHistory.Count -gt 0) {
        Write-ColorOutput "📊 Total Alerts Generated: $($script:AlertHistory.Count)" $Colors.Cyan
    }
}

# Run the main function
Main
