# 🚀 Tikit FastAPI Backend

High-performance event management API built with FastAPI, Supabase, and modern Python technologies.

## ✨ Features

### 🏗️ Architecture
- **FastAPI Framework**: High-performance async API
- **Supabase Integration**: PostgreSQL database with real-time features
- **Redis Caching**: Advanced caching with fallback to memory
- **WebSocket Support**: Real-time notifications and updates
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Advanced rate limiting with Redis backend
- **CSRF Protection**: Security middleware for state-changing operations

### 🔧 Core Services
- **Authentication**: User registration, login, JWT tokens
- **Event Management**: Create, update, manage events
- **Ticket System**: QR code generation, verification, scanning
- **Payment Processing**: Paystack, Flutterwave integration
- **Notifications**: Push, SMS, email notifications
- **Analytics**: Business intelligence and reporting
- **Admin Panel**: System administration and moderation
- **Real-time**: WebSocket connections and live updates

### 🛡️ Security Features
- CSRF token protection
- Rate limiting per endpoint
- JWT token validation
- Input sanitization
- Security headers
- Request size limits
- User agent filtering

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Redis (optional, falls back to memory cache)
- Supabase account

### Installation

1. **Clone and navigate to backend**
```bash
cd apps/backend-fastapi
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start development server**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Using Docker

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

2. **Or build manually**
```bash
docker build -t tikit-fastapi .
docker run -p 8000:8000 tikit-fastapi
```

## 📁 Project Structure

```
apps/backend-fastapi/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Multi-service setup
├── deploy.sh              # Deployment script
├── .env.example           # Environment variables template
├── routers/               # API route handlers
│   ├── auth.py           # Authentication endpoints
│   ├── events.py         # Event management
│   ├── tickets.py        # Ticket operations
│   ├── payments.py       # Payment processing
│   ├── admin.py          # Admin functions
│   ├── notifications.py  # Notification system
│   ├── analytics.py      # Analytics and reporting
│   └── realtime.py       # WebSocket endpoints
├── services/              # Business logic services
│   ├── auth_service.py   # Authentication logic
│   ├── event_service.py  # Event management
│   ├── ticket_service.py # Ticket operations
│   ├── payment_service.py # Payment processing
│   ├── supabase_client.py # Database client
│   └── cache_service.py  # Caching service
├── middleware/            # Custom middleware
│   ├── auth.py           # JWT authentication
│   ├── rate_limiter.py   # Rate limiting
│   └── security.py       # Security headers
├── models/               # Pydantic schemas
│   ├── schemas.py        # Base schemas
│   ├── auth_schemas.py   # Authentication models
│   ├── event_schemas.py  # Event models
│   └── ticket_schemas.py # Ticket models
└── tests/                # Test files
    ├── test_auth.py      # Authentication tests
    ├── test_events.py    # Event tests
    └── test_tickets.py   # Ticket tests
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Application
ENVIRONMENT=development
DEBUG=true
PORT=8000

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Payment Gateways
PAYSTACK_SECRET_KEY=your_paystack_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_key

# SMS/Email
AFRICASTALKING_API_KEY=your_africastalking_key
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
```

## 📊 API Documentation

### Automatic Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get current user

#### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/{id}` - Get event details
- `PUT /api/events/{id}` - Update event

#### Tickets
- `POST /api/tickets/purchase` - Purchase tickets
- `GET /api/tickets/my-tickets` - User's tickets
- `POST /api/tickets/verify` - Verify ticket
- `GET /api/tickets/{id}/qr` - Get QR code

#### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/wallet/balance` - Wallet balance
- `POST /api/payments/wallet/topup` - Top up wallet

#### Real-time
- `WebSocket /api/realtime/ws/{connection_id}` - WebSocket connection
- `POST /api/realtime/broadcast` - Broadcast message
- `POST /api/realtime/notify-event-update` - Event updates

## 🧪 Testing

### Run Tests
```bash
# All tests
python -m pytest

# Specific test file
python -m pytest tests/test_auth.py

# With coverage
python -m pytest --cov=. --cov-report=html
```

### Test Structure
- Unit tests for services
- Integration tests for API endpoints
- WebSocket connection tests
- Authentication flow tests

## 🚀 Deployment

### Using Deployment Script
```bash
# Deploy to Railway
./deploy.sh railway

# Deploy to Render
./deploy.sh render

# Deploy to DigitalOcean
./deploy.sh digitalocean

# Build Docker image
./deploy.sh docker

# Start development
./deploy.sh dev
```

### Manual Deployment

#### Railway
```bash
railway login
railway init
railway up
```

#### Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy from dashboard

#### DigitalOcean App Platform
```bash
doctl apps create app.yaml
```

#### AWS (ECS/Lambda)
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin
docker build -t tikit-fastapi .
docker tag tikit-fastapi:latest your-account.dkr.ecr.us-east-1.amazonaws.com/tikit-fastapi:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/tikit-fastapi:latest
```

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Metrics
- Application metrics via `/metrics` endpoint
- Redis statistics via cache service
- WebSocket connection stats
- Rate limiting statistics

### Logging
- Structured logging with Python logging
- Request/response logging
- Error tracking with Sentry (optional)
- Performance monitoring

## 🛠️ Development

### Code Style
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Database Migrations
```bash
# Using Supabase migrations
supabase migration new migration_name
supabase db push
```

### Adding New Features

1. **Create route handler** in `routers/`
2. **Add business logic** in `services/`
3. **Define schemas** in `models/`
4. **Add tests** in `tests/`
5. **Update documentation**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: support@tikit.app

---

**Built with ❤️ using FastAPI, Supabase, and modern Python technologies.**