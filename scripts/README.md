# Kong Auto-Scaling System for Street Noshery

This project implements a comprehensive auto-scaling solution for your Kong load balancer setup, allowing dynamic scaling from 3 to 6 backend service instances based on load metrics.

## 🚀 Features

- **Dynamic Scaling**: Automatically scales backend services from 3 to 6 instances based on load
- **Load Monitoring**: Real-time monitoring of CPU, memory, request rate, and response time
- **Health Checks**: Continuous health monitoring of all services
- **Kong Integration**: Automatic upstream target management in Kong
- **Deployment Tools**: Comprehensive deployment and management scripts
- **Alert System**: Configurable alerts for threshold breaches

## 📁 Project Structure

```
scripts/
├── kong-auto-scaling.ps1    # Main auto-scaling script (PowerShell)
├── kong-auto-scaling.sh     # Main auto-scaling script (Bash/Linux)
├── kong-monitoring.ps1      # Monitoring dashboard script
├── kong-deployment.ps1      # Deployment and management script
└── README.md               # This file

docker-compose.yml           # Updated with scaling support
kong.yml                     # Updated Kong configuration
```

## 🛠️ Prerequisites

- Docker and Docker Compose
- PowerShell (for Windows) or Bash (for Linux)
- Kong Gateway running
- Backend services built and ready

## 🚀 Quick Start

### 1. Start Base Services

```powershell
# Start Kong and initial 3 backend instances
.\scripts\kong-deployment.ps1 -Action start -Instances 3 -IncludeKong
```

### 2. Start Auto-Scaling

```powershell
# Start auto-scaling service
.\scripts\kong-auto-scaling.ps1 -MinInstances 3 -MaxInstances 6
```

### 3. Monitor Services

```powershell
# Open monitoring dashboard
.\scripts\kong-monitoring.ps1 -RefreshInterval 5
```

## 📊 Auto-Scaling Configuration

### Default Settings

- **Min Instances**: 3
- **Max Instances**: 6
- **Scale Up Threshold**: 80% CPU/Memory usage
- **Scale Down Threshold**: 30% CPU/Memory usage
- **Check Interval**: 30 seconds
- **Cooldown Period**: 5 minutes

### Custom Configuration

```powershell
.\scripts\kong-auto-scaling.ps1 `
    -MinInstances 2 `
    -MaxInstances 8 `
    -ScaleUpThreshold 75 `
    -ScaleDownThreshold 25 `
    -CheckInterval 20 `
    -CooldownPeriod 300
```

## 🔧 Management Commands

### Deployment Script Usage

```powershell
# Show service status
.\scripts\kong-deployment.ps1 -Action status

# Scale to 5 instances
.\scripts\kong-deployment.ps1 -Action scale -Instances 5

# View logs
.\scripts\kong-deployment.ps1 -Action logs -ServiceName backend

# Health check
.\scripts\kong-deployment.ps1 -Action health

# Restart services
.\scripts\kong-deployment.ps1 -Action restart -Instances 3

# Cleanup (remove all containers)
.\scripts\kong-deployment.ps1 -Action cleanup -Force
```

### Monitoring Script Usage

```powershell
# Basic monitoring
.\scripts\kong-monitoring.ps1

# Custom refresh interval
.\scripts\kong-monitoring.ps1 -RefreshInterval 10

# Export metrics to file
.\scripts\kong-monitoring.ps1 -ExportToFile -OutputFile "metrics.json"

# Enable alert mode
.\scripts\kong-monitoring.ps1 -AlertMode -CpuThreshold 85 -MemoryThreshold 85

# Show historical data
.\scripts\kong-monitoring.ps1 -ShowHistory -HistoryDays 7
```

## 📈 Scaling Triggers

### Scale Up Conditions
- CPU usage > 80%
- Memory usage > 80%
- Request rate > 150 requests/second
- Response time > 1000ms

### Scale Down Conditions
- CPU usage < 30%
- Memory usage < 30%
- Request rate < 50 requests/second
- All conditions must be met for scale down

## 🏥 Health Monitoring

The system continuously monitors:

- **Kong Gateway**: Connection status and metrics
- **Backend Services**: Container status, CPU, memory, uptime
- **Upstream Targets**: Health status in Kong
- **System Resources**: Overall system metrics
- **Response Times**: API endpoint response times

## 🚨 Alert System

Configure alerts for:
- High CPU usage
- High memory usage
- Slow response times
- Service health issues
- Overall system health

## 🔄 Scaling Process

### Scale Up Process
1. Monitor metrics every 30 seconds
2. Check if scale-up conditions are met
3. Verify cooldown period has passed
4. Start new backend container
5. Add target to Kong upstream
6. Wait for health check
7. Update scaling history

### Scale Down Process
1. Monitor metrics every 30 seconds
2. Check if scale-down conditions are met
3. Verify cooldown period has passed
4. Remove target from Kong upstream
5. Stop and remove container
6. Update scaling history

## 📊 Metrics Collection

The system collects and tracks:

- **Container Metrics**: CPU, memory, network I/O, uptime
- **Kong Metrics**: Request rate, response time, error rate
- **System Metrics**: Overall CPU, memory, disk usage
- **Health Metrics**: Service health status
- **Scaling History**: All scaling operations with timestamps

## 🛡️ Safety Features

- **Cooldown Periods**: Prevent rapid scaling oscillations
- **Health Checks**: Ensure services are ready before traffic routing
- **Graceful Shutdown**: Proper cleanup of containers and Kong targets
- **Dry Run Mode**: Test scaling operations without making changes
- **Force Protection**: Confirmation required for destructive operations

## 🔧 Troubleshooting

### Common Issues

1. **Kong Not Accessible**
   ```powershell
   # Check Kong status
   .\scripts\kong-deployment.ps1 -Action status
   
   # Restart Kong
   .\scripts\kong-deployment.ps1 -Action restart -IncludeKong
   ```

2. **Backend Services Not Starting**
   ```powershell
   # Check logs
   .\scripts\kong-deployment.ps1 -Action logs -ServiceName backend
   
   # Check Docker status
   docker ps --filter "name=street-noshery-backend"
   ```

3. **Scaling Not Working**
   ```powershell
   # Run in dry-run mode to see what would happen
   .\scripts\kong-auto-scaling.ps1 -DryRun -Verbose
   
   # Check Kong upstream targets
   .\scripts\kong-deployment.ps1 -Action status
   ```

### Debug Mode

```powershell
# Enable verbose output
.\scripts\kong-auto-scaling.ps1 -Verbose

# Enable dry run mode
.\scripts\kong-auto-scaling.ps1 -DryRun
```

## 📋 Configuration Files

### docker-compose.yml
- Added backend-4, backend-5, backend-6 services
- Configured with scaling profiles
- Proper port mapping (3023, 3024, 3025)

### kong.yml
- Updated upstream targets configuration
- Added comments for dynamic targets
- Maintains load balancing configuration

## 🔄 Continuous Operation

### Running as Service

For production deployment, consider running the auto-scaling script as a Windows Service or Linux systemd service:

**Windows Service Example:**
```powershell
# Install as Windows Service using NSSM
nssm install KongAutoScaling "powershell.exe" "-File C:\path\to\kong-auto-scaling.ps1"
nssm start KongAutoScaling
```

**Linux Systemd Example:**
```bash
# Create systemd service file
sudo nano /etc/systemd/system/kong-auto-scaling.service

# Enable and start service
sudo systemctl enable kong-auto-scaling
sudo systemctl start kong-auto-scaling
```

## 📊 Performance Optimization

### Recommended Settings

- **Check Interval**: 30 seconds (balance between responsiveness and resource usage)
- **Cooldown Period**: 5 minutes (prevent oscillation)
- **Scale Up Threshold**: 80% (conservative scaling)
- **Scale Down Threshold**: 30% (aggressive scale down)

### Resource Requirements

- **Auto-scaling Script**: Minimal CPU/memory usage
- **Monitoring Script**: Low resource impact
- **Backend Services**: Scale based on application requirements

## 🔐 Security Considerations

- Kong API keys are required for authentication
- All scripts include error handling and validation
- Dry-run mode prevents accidental changes
- Force flags require explicit confirmation

## 📈 Monitoring and Logging

### Log Files
- Scaling history: `/tmp/kong_scaling_history.log` (Linux) or `%TEMP%\kong_scaling_history.log` (Windows)
- Metrics export: Configurable JSON output
- Container logs: Available via Docker commands

### Metrics Export
```powershell
# Export metrics to file
.\scripts\kong-monitoring.ps1 -ExportToFile -OutputFile "metrics-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Test auto-scaling in development environment
- [ ] Configure appropriate thresholds for your workload
- [ ] Set up monitoring and alerting
- [ ] Plan for database connection pooling
- [ ] Configure proper logging and metrics collection

### Deployment Steps
1. Deploy base infrastructure (Kong, database)
2. Deploy initial backend instances
3. Configure Kong upstream targets
4. Start auto-scaling service
5. Enable monitoring and alerting
6. Test scaling operations
7. Monitor performance and adjust thresholds

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs and metrics
3. Test with dry-run mode
4. Verify Kong and Docker status

## 🔄 Updates and Maintenance

### Regular Maintenance
- Monitor scaling history for patterns
- Adjust thresholds based on actual usage
- Update Docker images regularly
- Review and clean up old metrics data

### Scaling the System
- Increase max instances if needed
- Adjust thresholds based on performance
- Consider horizontal scaling of Kong itself
- Monitor resource usage of the auto-scaling system

---

**Note**: This auto-scaling system is designed for your specific Kong setup with Street Noshery backend services. Adjust thresholds and configurations based on your actual workload patterns and performance requirements.
