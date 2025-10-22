#!/bin/bash

# Kong Setup Script for Street Noshery Project
# This script helps configure Kong services, routes, and authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kong Admin API URL
KONG_ADMIN_URL="http://localhost:8001"

echo -e "${BLUE}🚀 Kong Setup Script for Street Noshery${NC}"
echo "================================================"

# Function to check if Kong is running
check_kong_status() {
    echo -e "${YELLOW}📡 Checking Kong status...${NC}"
    if curl -s "$KONG_ADMIN_URL/status" > /dev/null; then
        echo -e "${GREEN}✅ Kong is running and accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ Kong is not accessible at $KONG_ADMIN_URL${NC}"
        echo "Please make sure Kong is running with: docker-compose up -d"
        return 1
    fi
}

# Function to create service
create_service() {
    echo -e "${YELLOW}🔧 Creating Street Noshery service...${NC}"
    
    curl -i -X POST "$KONG_ADMIN_URL/services/" \
        --data "name=street-noshery-backend" \
        --data "url=http://backend:3020" \
        --data "connect_timeout=60000" \
        --data "write_timeout=60000" \
        --data "read_timeout=60000" \
        --data "retries=5"
    
    echo -e "${GREEN}✅ Service created successfully${NC}"
}

# Function to create routes
create_routes() {
    echo -e "${YELLOW}🛣️  Creating routes...${NC}"
    
    # Main API route
    curl -i -X POST "$KONG_ADMIN_URL/services/street-noshery-backend/routes" \
        --data "name=street-noshery-main-route" \
        --data "paths[]=/street-noshery" \
        --data "strip_path=false" \
        --data "methods[]=GET" \
        --data "methods[]=POST" \
        --data "methods[]=PUT" \
        --data "methods[]=DELETE" \
        --data "methods[]=PATCH" \
        --data "methods[]=OPTIONS"
    
    # Health check route (no auth)
    curl -i -X POST "$KONG_ADMIN_URL/services/street-noshery-backend/routes" \
        --data "name=street-noshery-health-route" \
        --data "paths[]=/health" \
        --data "strip_path=false" \
        --data "methods[]=GET"
    
    # Public routes (no auth)
    curl -i -X POST "$KONG_ADMIN_URL/services/street-noshery-backend/routes" \
        --data "name=street-noshery-public-route" \
        --data "paths[]=/street-noshery/auth/login" \
        --data "paths[]=/street-noshery/auth/register" \
        --data "paths[]=/street-noshery/auth/forgot-password" \
        --data "paths[]=/street-noshery/menu/public" \
        --data "strip_path=false" \
        --data "methods[]=GET" \
        --data "methods[]=POST" \
        --data "methods[]=OPTIONS"
    
    echo -e "${GREEN}✅ Routes created successfully${NC}"
}

# Function to create consumers
create_consumers() {
    echo -e "${YELLOW}👥 Creating API consumers...${NC}"
    
    # Web client consumer
    curl -i -X POST "$KONG_ADMIN_URL/consumers/" \
        --data "username=street-noshery-web-client" \
        --data "custom_id=web-client-001"
    
    curl -i -X POST "$KONG_ADMIN_URL/consumers/street-noshery-web-client/key-auth" \
        --data "key=web-api-key-12345"
    
    # Mobile client consumer
    curl -i -X POST "$KONG_ADMIN_URL/consumers/" \
        --data "username=street-noshery-mobile-client" \
        --data "custom_id=mobile-client-001"
    
    curl -i -X POST "$KONG_ADMIN_URL/consumers/street-noshery-mobile-client/key-auth" \
        --data "key=mobile-api-key-67890"
    
    # Admin client consumer
    curl -i -X POST "$KONG_ADMIN_URL/consumers/" \
        --data "username=street-noshery-admin-client" \
        --data "custom_id=admin-client-001"
    
    curl -i -X POST "$KONG_ADMIN_URL/consumers/street-noshery-admin-client/key-auth" \
        --data "key=admin-api-key-11111"
    
    echo -e "${GREEN}✅ Consumers created successfully${NC}"
}

# Function to enable plugins
enable_plugins() {
    echo -e "${YELLOW}🔌 Enabling plugins...${NC}"
    
    # CORS plugin
    curl -i -X POST "$KONG_ADMIN_URL/services/street-noshery-backend/plugins" \
        --data "name=cors" \
        --data "config.origins[]=*" \
        --data "config.methods[]=GET" \
        --data "config.methods[]=POST" \
        --data "config.methods[]=PUT" \
        --data "config.methods[]=DELETE" \
        --data "config.methods[]=PATCH" \
        --data "config.methods[]=OPTIONS" \
        --data "config.headers[]=Accept" \
        --data "config.headers[]=Content-Type" \
        --data "config.headers[]=Authorization" \
        --data "config.headers[]=apikey" \
        --data "config.headers[]=x-api-key" \
        --data "config.exposed_headers[]=X-Auth-Token" \
        --data "config.exposed_headers[]=X-Response-Time" \
        --data "config.credentials=true" \
        --data "config.max_age=3600"
    
    # Rate limiting plugin
    curl -i -X POST "$KONG_ADMIN_URL/services/street-noshery-backend/plugins" \
        --data "name=rate-limiting" \
        --data "config.minute=100" \
        --data "config.hour=1000" \
        --data "config.day=10000" \
        --data "config.policy=local"
    
    # Key authentication plugin (for protected routes only)
    curl -i -X POST "$KONG_ADMIN_URL/routes/street-noshery-main-route/plugins" \
        --data "name=key-auth" \
        --data "config.key_names[]=apikey" \
        --data "config.key_names[]=x-api-key" \
        --data "config.hide_credentials=false"
    
    echo -e "${GREEN}✅ Plugins enabled successfully${NC}"
}

# Function to test the setup
test_setup() {
    echo -e "${YELLOW}🧪 Testing the setup...${NC}"
    
    # Test health endpoint (no auth required)
    echo "Testing health endpoint..."
    curl -i "$KONG_ADMIN_URL/health" || echo -e "${RED}❌ Health endpoint test failed${NC}"
    
    # Test API endpoint with authentication
    echo "Testing API endpoint with authentication..."
    curl -i -H "apikey: web-api-key-12345" "http://localhost:8000/street-noshery/health" || echo -e "${RED}❌ API endpoint test failed${NC}"
    
    echo -e "${GREEN}✅ Setup test completed${NC}"
}

# Function to display usage information
display_usage() {
    echo -e "${BLUE}📋 Kong Setup Complete!${NC}"
    echo "=========================="
    echo ""
    echo -e "${GREEN}🌐 Access Points:${NC}"
    echo "• Kong Proxy: http://localhost:8000"
    echo "• Kong Admin API: http://localhost:8001"
    echo "• Kong Manager (GUI): http://localhost:8002"
    echo "• Konga (Alternative GUI): http://localhost:1337"
    echo ""
    echo -e "${GREEN}🔑 API Keys:${NC}"
    echo "• Web Client: web-api-key-12345"
    echo "• Mobile Client: mobile-api-key-67890"
    echo "• Admin Client: admin-api-key-11111"
    echo ""
    echo -e "${GREEN}📡 Test Commands:${NC}"
    echo "• Health check (no auth): curl http://localhost:8000/health"
    echo "• API with auth: curl -H 'apikey: web-api-key-12345' http://localhost:8000/street-noshery/"
    echo ""
    echo -e "${GREEN}🛠️  Management:${NC}"
    echo "• View services: curl $KONG_ADMIN_URL/services"
    echo "• View routes: curl $KONG_ADMIN_URL/routes"
    echo "• View consumers: curl $KONG_ADMIN_URL/consumers"
    echo "• View plugins: curl $KONG_ADMIN_URL/plugins"
}

# Main execution
main() {
    if ! check_kong_status; then
        exit 1
    fi
    
    create_service
    create_routes
    create_consumers
    enable_plugins
    test_setup
    display_usage
}

# Run the main function
main "$@"
