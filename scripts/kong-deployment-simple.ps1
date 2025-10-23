# Kong Deployment Script for Street Noshery Project
# Simplified version for testing

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "scale", "status", "logs", "health", "deploy", "cleanup")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [int]$Instances = 3,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "backend",
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeKong,
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeDatabase
)

# Configuration
$DOCKER_COMPOSE_FILE = "docker-compose.yml"
$KONG_ADMIN_URL = "http://localhost:8001"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Colors.Yellow
    
    # Check Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-ColorOutput "✅ Docker: $dockerVersion" $Colors.Green
        }
    }
    catch {
        Write-ColorOutput "❌ Docker is not installed or not running" $Colors.Red
        return $false
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version 2>$null
        if ($composeVersion) {
            Write-ColorOutput "✅ Docker Compose: $composeVersion" $Colors.Green
        }
    }
    catch {
        Write-ColorOutput "❌ Docker Compose is not installed" $Colors.Red
        return $false
    }
    
    return $true
}

function Start-Services {
    param([int]$InstanceCount = 3)
    
    Write-ColorOutput "🚀 Starting Street Noshery services..." $Colors.Blue
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would start $InstanceCount backend instances" $Colors.Magenta
        return
    }
    
    try {
        # Start Kong and database first
        if ($IncludeKong) {
            Write-ColorOutput "📦 Starting Kong Gateway and Database..." $Colors.Yellow
            docker-compose -f $DOCKER_COMPOSE_FILE up -d kong-database kong-migration kong konga
            Start-Sleep -Seconds 10
        }
        
        # Start backend services
        Write-ColorOutput "🔧 Starting backend services..." $Colors.Yellow
        for ($i = 1; $i -le $InstanceCount; $i++) {
            docker-compose -f $DOCKER_COMPOSE_FILE up -d "backend-$i"
            Start-Sleep -Seconds 5
        }
        
        # Wait for services to be ready
        Write-ColorOutput "⏳ Waiting for services to be ready..." $Colors.Yellow
        Start-Sleep -Seconds 30
        
        Write-ColorOutput "✅ Services started successfully" $Colors.Green
        Show-ServiceStatus
    }
    catch {
        Write-ColorOutput "❌ Error starting services: $($_.Exception.Message)" $Colors.Red
    }
}

function Stop-Services {
    param([switch]$All)
    
    Write-ColorOutput "🛑 Stopping Street Noshery services..." $Colors.Blue
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would stop services" $Colors.Magenta
        return
    }
    
    try {
        if ($All) {
            # Stop all services including Kong
            docker-compose -f $DOCKER_COMPOSE_FILE down
            Write-ColorOutput "✅ All services stopped" $Colors.Green
        }
        else {
            # Stop only backend services
            $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
            foreach ($container in $containers) {
                docker stop $container
                Write-ColorOutput "🛑 Stopped $container" $Colors.Yellow
            }
            Write-ColorOutput "✅ Backend services stopped" $Colors.Green
        }
    }
    catch {
        Write-ColorOutput "❌ Error stopping services: $($_.Exception.Message)" $Colors.Red
    }
}

function Scale-Services {
    param([int]$TargetInstances)
    
    Write-ColorOutput "📈 Scaling services to $TargetInstances instances..." $Colors.Blue
    
    if ($TargetInstances -lt 1 -or $TargetInstances -gt 6) {
        Write-ColorOutput "❌ Invalid instance count. Must be between 1 and 6" $Colors.Red
        return
    }
    
    $currentInstances = Get-CurrentInstanceCount
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would scale from $currentInstances to $TargetInstances instances" $Colors.Magenta
        return
    }
    
    try {
        if ($TargetInstances -gt $currentInstances) {
            # Scale up
            Write-ColorOutput "📈 Scaling up from $currentInstances to $TargetInstances instances..." $Colors.Yellow
            for ($i = $currentInstances + 1; $i -le $TargetInstances; $i++) {
                Add-BackendInstance $i
                Start-Sleep -Seconds 10
            }
        }
        elseif ($TargetInstances -lt $currentInstances) {
            # Scale down
            Write-ColorOutput "📉 Scaling down from $currentInstances to $TargetInstances instances..." $Colors.Yellow
            for ($i = $currentInstances; $i -gt $TargetInstances; $i--) {
                Remove-BackendInstance $i
                Start-Sleep -Seconds 5
            }
        }
        else {
            Write-ColorOutput "ℹ️  Already at target instance count: $TargetInstances" $Colors.Cyan
        }
        
        Write-ColorOutput "✅ Scaling completed successfully" $Colors.Green
        Show-ServiceStatus
    }
    catch {
        Write-ColorOutput "❌ Error scaling services: $($_.Exception.Message)" $Colors.Red
    }
}

function Add-BackendInstance {
    param([int]$InstanceNumber)
    
    $containerName = "street-noshery-backend-$InstanceNumber"
    
    Write-ColorOutput "➕ Adding backend instance $InstanceNumber..." $Colors.Yellow
    
    try {
        # Start the container
        docker-compose -f $DOCKER_COMPOSE_FILE up -d "backend-$InstanceNumber"
        
        # Wait for container to be ready
        Start-Sleep -Seconds 15
        
        Write-ColorOutput "✅ Added backend instance $InstanceNumber" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ Failed to add backend instance $InstanceNumber`: $($_.Exception.Message)" $Colors.Red
    }
}

function Remove-BackendInstance {
    param([int]$InstanceNumber)
    
    $containerName = "street-noshery-backend-$InstanceNumber"
    
    Write-ColorOutput "➖ Removing backend instance $InstanceNumber..." $Colors.Yellow
    
    try {
        # Stop and remove container
        docker stop $containerName
        docker rm $containerName
        
        Write-ColorOutput "✅ Removed backend instance $InstanceNumber" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ Failed to remove backend instance $InstanceNumber`: $($_.Exception.Message)" $Colors.Red
    }
}

function Get-CurrentInstanceCount {
    try {
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        return $containers.Count
    }
    catch {
        return 0
    }
}

function Show-ServiceStatus {
    Write-ColorOutput "📊 Service Status" $Colors.Cyan
    Write-ColorOutput "=================" $Colors.Cyan
    
    try {
        # Kong Status
        try {
            $kongStatus = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -TimeoutSec 5
            Write-ColorOutput "🌐 Kong Gateway: $($kongStatus.server.state)" $Colors.Green
        }
        catch {
            Write-ColorOutput "🌐 Kong Gateway: Not accessible" $Colors.Red
        }
        
        # Backend Services
        $containers = docker ps --filter "name=street-noshery-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-ColorOutput "🔧 Backend Services:" $Colors.Cyan
        Write-ColorOutput $containers $Colors.White
        
        Write-ColorOutput ""
    }
    catch {
        Write-ColorOutput "❌ Error getting service status: $($_.Exception.Message)" $Colors.Red
    }
}

function Show-ServiceLogs {
    param([string]$ServiceName = "backend", [int]$Lines = 50)
    
    Write-ColorOutput "📋 Service Logs ($ServiceName)" $Colors.Cyan
    Write-ColorOutput "=============================" $Colors.Cyan
    
    try {
        if ($ServiceName -eq "kong") {
            docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=$Lines kong
        }
        elseif ($ServiceName -eq "backend") {
            $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
            foreach ($container in $containers) {
                Write-ColorOutput "--- Logs for $container ---" $Colors.Yellow
                docker logs --tail=$Lines $container
                Write-ColorOutput ""
            }
        }
        else {
            docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=$Lines $ServiceName
        }
    }
    catch {
        Write-ColorOutput "❌ Error getting service logs: $($_.Exception.Message)" $Colors.Red
    }
}

function Test-ServiceHealth {
    Write-ColorOutput "🏥 Health Check" $Colors.Cyan
    Write-ColorOutput "===============" $Colors.Cyan
    
    try {
        # Test Kong Gateway
        try {
            $kongHealth = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/status" -Method Get -TimeoutSec 5
            Write-ColorOutput "✅ Kong Gateway: Healthy" $Colors.Green
        }
        catch {
            Write-ColorOutput "❌ Kong Gateway: Unhealthy" $Colors.Red
        }
        
        # Test Backend Services
        $containers = docker ps --filter "name=street-noshery-backend" --format "{{.Names}}"
        foreach ($container in $containers) {
            $port = Get-ContainerPort $container
            if ($port) {
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:$port/street-noshery/customer" -Method Get -TimeoutSec 5
                    Write-ColorOutput "✅ $container`: Healthy" $Colors.Green
                }
                catch {
                    Write-ColorOutput "❌ $container`: Unhealthy" $Colors.Red
                }
            }
        }
        
        # Test Kong Proxy
        try {
            $proxyResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
            Write-ColorOutput "✅ Kong Proxy: Healthy" $Colors.Green
        }
        catch {
            Write-ColorOutput "❌ Kong Proxy: Unhealthy" $Colors.Red
        }
        
    }
    catch {
        Write-ColorOutput "❌ Error during health check: $($_.Exception.Message)" $Colors.Red
    }
}

function Get-ContainerPort {
    param([string]$containerName)
    
    try {
        $port = docker port $containerName 3020
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

function Deploy-Services {
    Write-ColorOutput "🚀 Deploying Street Noshery services..." $Colors.Blue
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would deploy services" $Colors.Magenta
        return
    }
    
    try {
        # Build images
        Write-ColorOutput "🔨 Building Docker images..." $Colors.Yellow
        docker-compose -f $DOCKER_COMPOSE_FILE build
        
        # Start services
        Start-Services $Instances
        
        # Run health checks
        Start-Sleep -Seconds 30
        Test-ServiceHealth
        
        Write-ColorOutput "✅ Deployment completed successfully" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ Error during deployment: $($_.Exception.Message)" $Colors.Red
    }
}

function Cleanup-Services {
    Write-ColorOutput "🧹 Cleaning up services..." $Colors.Blue
    
    if ($DryRun) {
        Write-ColorOutput "🔍 [DRY RUN] Would cleanup services" $Colors.Magenta
        return
    }
    
    try {
        if ($Force) {
            # Force cleanup - remove everything
            Write-ColorOutput "⚠️  Force cleanup enabled - removing all containers and volumes" $Colors.Yellow
            docker-compose -f $DOCKER_COMPOSE_FILE down -v --remove-orphans
            docker system prune -f
        }
        else {
            # Normal cleanup - stop and remove containers
            docker-compose -f $DOCKER_COMPOSE_FILE down
        }
        
        Write-ColorOutput "✅ Cleanup completed" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ Error during cleanup: $($_.Exception.Message)" $Colors.Red
    }
}

function Main {
    Write-ColorOutput "🚀 Kong Deployment Script" $Colors.Blue
    Write-ColorOutput "=========================" $Colors.Blue
    Write-ColorOutput "Action: $Action" $Colors.White
    Write-ColorOutput "Instances: $Instances" $Colors.White
    Write-ColorOutput "Dry Run: $DryRun" $Colors.White
    Write-ColorOutput ""
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-ColorOutput "❌ Prerequisites not met. Please install Docker and Docker Compose." $Colors.Red
        return
    }
    
    # Execute action
    switch ($Action) {
        "start" {
            Start-Services $Instances
        }
        "stop" {
            Stop-Services
        }
        "scale" {
            Scale-Services $Instances
        }
        "status" {
            Show-ServiceStatus
        }
        "logs" {
            Show-ServiceLogs $ServiceName
        }
        "health" {
            Test-ServiceHealth
        }
        "deploy" {
            Deploy-Services
        }
        "cleanup" {
            Cleanup-Services
        }
        default {
            Write-ColorOutput "Available actions: start, stop, scale, status, logs, health, deploy, cleanup" $Colors.Cyan
        }
    }
}

# Run the main function
Main
