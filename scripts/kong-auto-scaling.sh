#!/bin/bash

# Kong Auto-Scaling Script for Street Noshery Project
# This script monitors load metrics and dynamically scales backend services from 3 to 6 instances

set -e

# Default configuration
MIN_INSTANCES=${MIN_INSTANCES:-3}
MAX_INSTANCES=${MAX_INSTANCES:-6}
SCALE_UP_THRESHOLD=${SCALE_UP_THRESHOLD:-80}
SCALE_DOWN_THRESHOLD=${SCALE_DOWN_THRESHOLD:-30}
CHECK_INTERVAL=${CHECK_INTERVAL:-30}
COOLDOWN_PERIOD=${COOLDOWN_PERIOD:-300}
DRY_RUN=${DRY_RUN:-false}
VERBOSE=${VERBOSE:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Kong Admin API URL
KONG_ADMIN_URL="http://localhost:8001"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Global variables for state tracking
LAST_SCALE_UP_TIME=0
LAST_SCALE_DOWN_TIME=0
CURRENT_INSTANCES=3
SCALING_HISTORY_FILE="/tmp/kong_scaling_history.log"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to get current timestamp
get_current_timestamp() {
    date +%s
}

# Function to check Kong status
check_kong_status() {
    if curl -s "$KONG_ADMIN_URL/status" > /dev/null 2>&1; then
        return 0
    else
        print_color $RED "❌ Kong is not accessible at $KONG_ADMIN_URL"
        return 1
    fi
}

# Function to get current backend instances
get_backend_instances() {
    local count=0
    if command -v docker >/dev/null 2>&1; then
        count=$(docker ps --filter "name=street-noshery-backend" --format "{{.Names}}" | wc -l)
    fi
    echo $count
}

# Function to get system metrics
get_system_metrics() {
    local cpu=0
    local memory=0
    local request_rate=0
    local response_time=0
    
    # Get Docker container metrics
    if command -v docker >/dev/null 2>&1; then
        local containers=$(docker ps --filter "name=street-noshery-backend" --format "{{.Names}}")
        local total_cpu=0
        local total_memory=0
        local container_count=0
        
        for container in $containers; do
            local stats=$(docker stats $container --no-stream --format "{{.CPUPerc}},{{.MemPerc}}" 2>/dev/null)
            if [ -n "$stats" ]; then
                local cpu_perc=$(echo $stats | cut -d',' -f1 | sed 's/%//')
                local mem_perc=$(echo $stats | cut -d',' -f2 | sed 's/%//')
                
                total_cpu=$(echo "$total_cpu + $cpu_perc" | bc -l)
                total_memory=$(echo "$total_memory + $mem_perc" | bc -l)
                container_count=$((container_count + 1))
            fi
        done
        
        if [ $container_count -gt 0 ]; then
            cpu=$(echo "scale=2; $total_cpu / $container_count" | bc -l)
            memory=$(echo "scale=2; $total_memory / $container_count" | bc -l)
        fi
    fi
    
    # Get Kong metrics for request rate and response time
    local kong_metrics=$(curl -s "$KONG_ADMIN_URL/metrics" 2>/dev/null || echo "")
    if [ -n "$kong_metrics" ]; then
        request_rate=$(get_request_rate_from_metrics "$kong_metrics")
        response_time=$(get_response_time_from_metrics "$kong_metrics")
    else
        request_rate=$(get_basic_request_rate)
    fi
    
    echo "$cpu,$memory,$request_rate,$response_time"
}

# Function to parse request rate from Kong metrics
get_request_rate_from_metrics() {
    local metrics_data="$1"
    echo "$metrics_data" | grep -o "kong_http_requests_total [0-9]*" | head -1 | awk '{print $2}' || echo "0"
}

# Function to parse response time from Kong metrics
get_response_time_from_metrics() {
    local metrics_data="$1"
    echo "$metrics_data" | grep -o "kong_request_latency_ms [0-9]*" | head -1 | awk '{print $2}' || echo "0"
}

# Function to get basic request rate (fallback)
get_basic_request_rate() {
    local start_time=$(date +%s%3N)
    if curl -s "http://localhost:8000/health" > /dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        # Simple heuristic: if response time is high, assume high load
        if [ $response_time -gt 1000 ]; then
            echo "200"
        elif [ $response_time -gt 500 ]; then
            echo "150"
        elif [ $response_time -gt 200 ]; then
            echo "100"
        else
            echo "50"
        fi
    else
        echo "0"
    fi
}

# Function to check if should scale up
should_scale_up() {
    local metrics="$1"
    local cpu=$(echo $metrics | cut -d',' -f1)
    local memory=$(echo $metrics | cut -d',' -f2)
    local request_rate=$(echo $metrics | cut -d',' -f3)
    local response_time=$(echo $metrics | cut -d',' -f4)
    
    local current_time=$(get_current_timestamp)
    
    # Check cooldown period
    if [ $((current_time - LAST_SCALE_UP_TIME)) -lt $COOLDOWN_PERIOD ]; then
        return 1
    fi
    
    # Check if already at max instances
    if [ $CURRENT_INSTANCES -ge $MAX_INSTANCES ]; then
        return 1
    fi
    
    # Check scaling conditions
    local should_scale=false
    local reasons=()
    
    if (( $(echo "$cpu > $SCALE_UP_THRESHOLD" | bc -l) )); then
        should_scale=true
        reasons+=("CPU usage: $(printf "%.2f" $cpu)%")
    fi
    
    if (( $(echo "$memory > $SCALE_UP_THRESHOLD" | bc -l) )); then
        should_scale=true
        reasons+=("Memory usage: $(printf "%.2f" $memory)%")
    fi
    
    if [ $request_rate -gt 150 ]; then
        should_scale=true
        reasons+=("Request rate: $request_rate")
    fi
    
    if [ $response_time -gt 1000 ]; then
        should_scale=true
        reasons+=("Response time: ${response_time}ms")
    fi
    
    if [ "$should_scale" = true ]; then
        print_color $YELLOW "📈 Scale up conditions met: $(IFS=', '; echo "${reasons[*]}")"
        return 0
    fi
    
    return 1
}

# Function to check if should scale down
should_scale_down() {
    local metrics="$1"
    local cpu=$(echo $metrics | cut -d',' -f1)
    local memory=$(echo $metrics | cut -d',' -f2)
    local request_rate=$(echo $metrics | cut -d',' -f3)
    
    local current_time=$(get_current_timestamp)
    
    # Check cooldown period
    if [ $((current_time - LAST_SCALE_DOWN_TIME)) -lt $COOLDOWN_PERIOD ]; then
        return 1
    fi
    
    # Check if already at min instances
    if [ $CURRENT_INSTANCES -le $MIN_INSTANCES ]; then
        return 1
    fi
    
    # Check scaling conditions
    local should_scale=true
    local reasons=()
    
    if (( $(echo "$cpu > $SCALE_DOWN_THRESHOLD" | bc -l) )); then
        should_scale=false
        reasons+=("CPU usage: $(printf "%.2f" $cpu)%")
    fi
    
    if (( $(echo "$memory > $SCALE_DOWN_THRESHOLD" | bc -l) )); then
        should_scale=false
        reasons+=("Memory usage: $(printf "%.2f" $memory)%")
    fi
    
    if [ $request_rate -gt 50 ]; then
        should_scale=false
        reasons+=("Request rate: $request_rate")
    fi
    
    if [ "$should_scale" = true ]; then
        print_color $CYAN "📉 Scale down conditions met: Low load detected"
        return 0
    else
        if [ "$VERBOSE" = "true" ]; then
            print_color $YELLOW "📊 Scale down blocked: $(IFS=', '; echo "${reasons[*]}")"
        fi
        return 1
    fi
}

# Function to add backend instance
add_backend_instance() {
    local instance_number=$1
    local container_name="street-noshery-backend-$instance_number"
    local port=$((3019 + instance_number))  # Ports: 3020, 3021, 3022, 3023, 3024, 3025
    
    print_color $BLUE "🚀 Adding backend instance $instance_number..."
    
    if [ "$DRY_RUN" = "true" ]; then
        print_color $MAGENTA "🔍 [DRY RUN] Would add container: $container_name on port $port"
        return 0
    fi
    
    # Start the new container
    docker run -d \
        --name "$container_name" \
        --network "backend_street_noshery_kong-network" \
        --restart unless-stopped \
        -p "$port:3020" \
        -e NODE_ENV=production \
        -e PORT=3020 \
        -e GLOBAL_PREFIX=street-noshery \
        -e INSTANCE_ID="backend-$instance_number" \
        -e MONGO_URL="mongodb+srv://streetnoshery:Sumit%40Godwan%401062@streetnoshery.g7ufm.mongodb.net/street_noshery?retryWrites=true&w=majority" \
        backend_street_noshery_backend-1
    
    # Wait for container to be ready
    sleep 10
    
    # Add target to Kong upstream
    curl -i -X POST "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets" \
        --data "target=$container_name:3020" \
        --data "weight=100"
    
    print_color $GREEN "✅ Successfully added backend instance $instance_number"
    return 0
}

# Function to remove backend instance
remove_backend_instance() {
    local instance_number=$1
    local container_name="street-noshery-backend-$instance_number"
    
    print_color $BLUE "🗑️  Removing backend instance $instance_number..."
    
    if [ "$DRY_RUN" = "true" ]; then
        print_color $MAGENTA "🔍 [DRY RUN] Would remove container: $container_name"
        return 0
    fi
    
    # Remove target from Kong upstream first
    local targets=$(curl -s "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets")
    local target_id=$(echo "$targets" | jq -r ".data[] | select(.target == \"$container_name:3020\") | .id" 2>/dev/null || echo "")
    
    if [ -n "$target_id" ]; then
        curl -i -X DELETE "$KONG_ADMIN_URL/upstreams/street-noshery-upstream/targets/$target_id"
    fi
    
    # Stop and remove container
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    print_color $GREEN "✅ Successfully removed backend instance $instance_number"
    return 0
}

# Function to update scaling history
update_scaling_history() {
    local action="$1"
    local from_instances="$2"
    local to_instances="$3"
    local metrics="$4"
    
    local timestamp=$(get_current_timestamp)
    local cpu=$(echo $metrics | cut -d',' -f1)
    local memory=$(echo $metrics | cut -d',' -f2)
    local request_rate=$(echo $metrics | cut -d',' -f3)
    local response_time=$(echo $metrics | cut -d',' -f4)
    
    echo "$timestamp,$action,$from_instances,$to_instances,$cpu,$memory,$request_rate,$response_time" >> "$SCALING_HISTORY_FILE"
    
    # Keep only last 50 entries
    if [ -f "$SCALING_HISTORY_FILE" ]; then
        tail -n 50 "$SCALING_HISTORY_FILE" > "${SCALING_HISTORY_FILE}.tmp"
        mv "${SCALING_HISTORY_FILE}.tmp" "$SCALING_HISTORY_FILE"
    fi
}

# Function to show metrics
show_metrics() {
    local metrics="$1"
    local cpu=$(echo $metrics | cut -d',' -f1)
    local memory=$(echo $metrics | cut -d',' -f2)
    local request_rate=$(echo $metrics | cut -d',' -f3)
    local response_time=$(echo $metrics | cut -d',' -f4)
    
    print_color $CYAN "📊 Current Metrics:"
    echo "   CPU Usage: $(printf "%.2f" $cpu)%"
    echo "   Memory Usage: $(printf "%.2f" $memory)%"
    echo "   Request Rate: $request_rate"
    echo "   Response Time: ${response_time}ms"
    echo "   Current Instances: $CURRENT_INSTANCES"
}

# Function to show scaling history
show_scaling_history() {
    print_color $CYAN "📈 Scaling History (Last 10 actions):"
    
    if [ -f "$SCALING_HISTORY_FILE" ]; then
        tail -n 10 "$SCALING_HISTORY_FILE" | while IFS=',' read -r timestamp action from_instances to_instances cpu memory request_rate response_time; do
            local time_str=$(date -d "@$timestamp" "+%H:%M:%S" 2>/dev/null || echo "$timestamp")
            echo "   $time_str - $action: $from_instances → $to_instances instances"
        done
    fi
}

# Function to handle cleanup on exit
cleanup() {
    print_color $YELLOW "🛑 Auto-scaling service stopped"
    show_scaling_history
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main function
main() {
    print_color $BLUE "🚀 Kong Auto-Scaling Service Started"
    print_color $BLUE "====================================="
    echo "Min Instances: $MIN_INSTANCES"
    echo "Max Instances: $MAX_INSTANCES"
    echo "Scale Up Threshold: ${SCALE_UP_THRESHOLD}%"
    echo "Scale Down Threshold: ${SCALE_DOWN_THRESHOLD}%"
    echo "Check Interval: $CHECK_INTERVAL seconds"
    echo "Cooldown Period: $COOLDOWN_PERIOD seconds"
    
    if [ "$DRY_RUN" = "true" ]; then
        print_color $MAGENTA "🔍 DRY RUN MODE - No actual changes will be made"
    fi
    
    echo ""
    
    # Initialize current instance count
    CURRENT_INSTANCES=$(get_backend_instances)
    print_color $GREEN "Current backend instances: $CURRENT_INSTANCES"
    
    while true; do
        if ! check_kong_status; then
            print_color $RED "❌ Kong is not accessible. Waiting for Kong to be available..."
            sleep $CHECK_INTERVAL
            continue
        fi
        
        # Get current metrics
        local metrics=$(get_system_metrics)
        
        if [ "$VERBOSE" = "true" ]; then
            show_metrics "$metrics"
        fi
        
        # Check if we should scale up
        if should_scale_up "$metrics"; then
            local new_instance_number=$((CURRENT_INSTANCES + 1))
            if add_backend_instance $new_instance_number; then
                CURRENT_INSTANCES=$((CURRENT_INSTANCES + 1))
                LAST_SCALE_UP_TIME=$(get_current_timestamp)
                update_scaling_history "SCALE_UP" $((CURRENT_INSTANCES - 1)) $CURRENT_INSTANCES "$metrics"
                print_color $GREEN "📈 Scaled up to $CURRENT_INSTANCES instances"
            fi
        # Check if we should scale down
        elif should_scale_down "$metrics"; then
            local instance_to_remove=$CURRENT_INSTANCES
            if remove_backend_instance $instance_to_remove; then
                CURRENT_INSTANCES=$((CURRENT_INSTANCES - 1))
                LAST_SCALE_DOWN_TIME=$(get_current_timestamp)
                update_scaling_history "SCALE_DOWN" $((CURRENT_INSTANCES + 1)) $CURRENT_INSTANCES "$metrics"
                print_color $GREEN "📉 Scaled down to $CURRENT_INSTANCES instances"
            fi
        else
            if [ "$VERBOSE" = "true" ]; then
                print_color $CYAN "📊 No scaling action needed"
            fi
        fi
        
        # Show scaling history every 10 iterations
        local history_lines=$(wc -l < "$SCALING_HISTORY_FILE" 2>/dev/null || echo "0")
        if [ $((history_lines % 10)) -eq 0 ] && [ $history_lines -gt 0 ]; then
            show_scaling_history
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Check dependencies
if ! command -v docker >/dev/null 2>&1; then
    print_color $RED "❌ Docker is required but not installed"
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    print_color $RED "❌ curl is required but not installed"
    exit 1
fi

if ! command -v bc >/dev/null 2>&1; then
    print_color $RED "❌ bc is required but not installed"
    exit 1
fi

# Run the main function
main "$@"
