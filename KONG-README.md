# Kong API Gateway Setup for Street Noshery

This project is configured with Kong as an API Gateway and load balancer with authentication services for your NestJS Street Noshery application.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│   Kong Gateway  │───▶│  NestJS Backend │
│                 │    │                 │    │                 │
│ • Web Client    │    │ • Load Balancer │    │ • Port 3020     │
│ • Mobile App    │    │ • Auth Service  │    │ • MongoDB       │
│ • Admin Panel   │    │ • Rate Limiting │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
├── docker-compose.yml     # Kong + PostgreSQL + Backend services
├── kong.conf             # Kong configuration file
├── kong.yml              # Kong declarative configuration
├── kong.env              # Environment variables
├── setup-kong.sh         # Bash setup script
├── setup-kong.ps1        # PowerShell setup script
└── backend/              # Your NestJS application
    ├── Dockerfile
    └── server.js
```

## 🚀 Quick Start

### 1. Start the Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Configure Kong

**Option A: Using PowerShell (Windows)**
```powershell
# Run the setup script
.\setup-kong.ps1

# Skip tests if needed
.\setup-kong.ps1 -SkipTests
```

**Option B: Using Bash (Linux/Mac)**
```bash
# Make script executable
chmod +x setup-kong.sh

# Run the setup script
./setup-kong.sh
```

### 3. Verify Setup

```bash
# Check Kong status
curl http://localhost:8001/status

# Test health endpoint (no auth required)
curl http://localhost:8000/health

# Test API with authentication
curl -H "apikey: web-api-key-12345" http://localhost:8000/street-noshery/
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Kong Proxy** | http://localhost:8000 | Main API gateway endpoint |
| **Kong Admin API** | http://localhost:8001 | Kong management API |
| **Kong Manager** | http://localhost:8002 | Kong web GUI |
| **Konga** | http://localhost:1337 | Alternative Kong GUI |
| **Backend** | http://localhost:3020 | Direct backend access |

## 🔑 API Authentication

### API Keys

| Client Type | API Key | Usage |
|-------------|---------|-------|
| **Web Client** | `web-api-key-12345` | Frontend applications |
| **Mobile Client** | `mobile-api-key-67890` | Mobile apps |
| **Admin Client** | `admin-api-key-11111` | Admin panels |

### Authentication Methods

**Header-based Authentication:**
```bash
curl -H "apikey: web-api-key-12345" http://localhost:8000/street-noshery/
```

**X-API-Key Header:**
```bash
curl -H "x-api-key: web-api-key-12345" http://localhost:8000/street-noshery/
```

## 🛣️ API Routes

### Protected Routes (Require Authentication)
- `GET/POST/PUT/DELETE /street-noshery/*` - All main API endpoints

### Public Routes (No Authentication Required)
- `GET /health` - Health check endpoint
- `POST /street-noshery/auth/login` - User login
- `POST /street-noshery/auth/register` - User registration
- `POST /street-noshery/auth/forgot-password` - Password reset
- `GET /street-noshery/menu/public` - Public menu items

## 🔧 Kong Features Enabled

### 1. **Load Balancing**
- Round-robin algorithm
- Health checks
- Automatic failover

### 2. **Authentication**
- API Key authentication
- Multiple consumer support
- Per-route authentication control

### 3. **Rate Limiting**
- 100 requests per minute
- 1000 requests per hour
- 10000 requests per day

### 4. **CORS Support**
- Cross-origin resource sharing
- Configurable origins and methods
- Credential support

### 5. **Request/Response Transformation**
- Header injection
- Request ID generation
- Response time tracking

### 6. **Monitoring**
- Prometheus metrics
- Request logging
- Health check endpoints

## 📊 Monitoring & Management

### Kong Admin API Examples

```bash
# List all services
curl http://localhost:8001/services

# List all routes
curl http://localhost:8001/routes

# List all consumers
curl http://localhost:8001/consumers

# List all plugins
curl http://localhost:8001/plugins

# Get service health
curl http://localhost:8001/services/street-noshery-backend/health
```

### Kong Manager GUI
Access Kong Manager at http://localhost:8002 for visual management of:
- Services and Routes
- Consumers and API Keys
- Plugins and Configuration
- Analytics and Monitoring

## 🔒 Security Features

### 1. **API Key Management**
- Unique keys per client type
- Easy key rotation
- Consumer-based access control

### 2. **Rate Limiting**
- Prevents API abuse
- Configurable limits per consumer
- Burst protection

### 3. **CORS Protection**
- Controlled cross-origin access
- Credential management
- Method restrictions

### 4. **Request Validation**
- Header validation
- Method restrictions
- Path-based routing

## 🛠️ Customization

### Adding New Consumers

```bash
# Create new consumer
curl -X POST http://localhost:8001/consumers/ \
  --data "username=new-client" \
  --data "custom_id=client-002"

# Add API key
curl -X POST http://localhost:8001/consumers/new-client/key-auth \
  --data "key=new-api-key-54321"
```

### Modifying Rate Limits

```bash
# Update rate limiting plugin
curl -X PATCH http://localhost:8001/plugins/{plugin-id} \
  --data "config.minute=200" \
  --data "config.hour=2000"
```

### Adding New Routes

```bash
# Add new route
curl -X POST http://localhost:8001/services/street-noshery-backend/routes \
  --data "name=new-route" \
  --data "paths[]=/street-noshery/new-endpoint" \
  --data "methods[]=GET"
```

## 🐛 Troubleshooting

### Common Issues

1. **Kong not accessible**
   ```bash
   # Check if Kong is running
   docker-compose ps
   
   # Check Kong logs
   docker-compose logs kong
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL status
   docker-compose logs kong-database
   
   # Restart database
   docker-compose restart kong-database
   ```

3. **Backend not responding**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Test direct backend access
   curl http://localhost:3020/street-noshery/health
   ```

### Health Checks

```bash
# Kong health
curl http://localhost:8001/status

# Backend health
curl http://localhost:8000/health

# Database health
docker-compose exec kong-database pg_isready -U kong
```

## 📝 Environment Variables

Key environment variables in `kong.env`:

```bash
# Database
KONG_PG_HOST=kong-database
KONG_PG_USER=kong
KONG_PG_PASSWORD=kong

# API Keys
WEB_API_KEY=web-api-key-12345
MOBILE_API_KEY=mobile-api-key-67890
ADMIN_API_KEY=admin-api-key-11111

# Rate Limits
RATE_LIMIT_MINUTE=100
RATE_LIMIT_HOUR=1000
RATE_LIMIT_DAY=10000
```

## 🔄 Updates & Maintenance

### Updating Kong Configuration

1. Modify `kong.yml` for declarative changes
2. Restart Kong: `docker-compose restart kong`
3. Or use Admin API for dynamic changes

### Backup & Restore

```bash
# Backup Kong configuration
docker-compose exec kong kong config db_export > kong-backup.yml

# Restore Kong configuration
docker-compose exec kong kong config db_import < kong-backup.yml
```

## 📚 Additional Resources

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Admin API Reference](https://docs.konghq.com/gateway/latest/admin-api/)
- [Kong Plugin Development](https://docs.konghq.com/gateway/latest/plugin-development/)
- [Kong Community](https://konghq.com/community/)

---

**Happy coding with Kong! 🚀**
