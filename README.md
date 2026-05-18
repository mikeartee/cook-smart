# Cook Smart

[![Version](https://img.shields.io/badge/version-1.1.8-blue.svg)](https://github.com/mikeartee/cook-smart)
[![Status](https://img.shields.io/badge/status-development-yellow.svg)](https://github.com/mikeartee/cook-smart)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)](LICENSE)

> **Intelligent Recipe Generation Platform**
> Transform your available ingredients into personalized meal recommendations with AI-powered recipe matching, dietary filtering, and smart inventory management.

> **Note on this fork.** This repository is a development fork of [`tootallgames2020/cook-smart`](https://github.com/tootallgames2020/cook-smart) (original copyright holder: Bradley L Turnbough). It is developed independently from the upstream repo and does not auto-deploy to `cooksmartapp.com` / `api.cooksmartapp.com` — those production endpoints are run from the upstream's infrastructure, which this fork does not have access to. Legal documents under `docs/legal/` retain the upstream's copyright/contact information unchanged.

## 🌟 Overview

Cook Smart is a React Native mobile app that matches your available ingredients to recipes using the FatSecret API. It includes barcode scanning (via Open Food Facts), dietary filtering, and smart inventory tracking. The backend is Node.js/Express with PostgreSQL.

This fork is in active development and has not launched to end users. There is a [Discord community](https://discord.gg/7mAeMvjGVH) for development discussion.

## ✨ Key Features

### Core Functionality

- **🔍 Intelligent Recipe Matching** - Ingredient-to-recipe correlation via FatSecret API
- **📱 Barcode Scanning** - Ingredient identification using Open Food Facts
- **🥗 Dietary Management** - Allergy and dietary restriction filtering
- **📊 Smart Inventory** - Ingredient tracking with expiration monitoring
- **⭐ Personalization** - Favorite recipes and custom preferences

### Advanced Features

- **🎯 Recipe Scaling** - Dynamic serving size adjustments
- **🛒 Shopping Lists** - Auto-generated lists based on missing ingredients
- **🏆 Gamification** - Points system and achievement tracking
- **👥 Referral Program** - User acquisition and rewards system
- **💳 Subscription Management** - Stripe-integrated payment processing

## 🏗️ Architecture

### Technology Stack

```
Frontend     │ React Native 0.82.1 (TypeScript)
Backend      │ Node.js 18+ / Express.js (TypeScript)
Database     │ PostgreSQL 16 (AWS RDS — single instance)
Storage      │ AWS S3 (Static Assets)
```

### Infrastructure

```
Backend      │ Single AWS EC2 instance (34.203.8.150)
Database     │ AWS RDS PostgreSQL (single instance)
SSL/TLS      │ AWS Certificate Manager
DNS          │ AWS Route 53
```

### External Integrations

- **FatSecret API** - Recipe database (1M+ recipes)
- **Open Food Facts** - Barcode and nutritional data
- **Stripe** - Payment processing and subscription management
- **Resend** - Transactional email delivery
- **Discord** - Community integration and notifications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- React Native CLI
- Android Studio (for Android development)
- PostgreSQL 12+ (local development)

### Installation

```bash
# Clone repository
git clone https://github.com/mikeartee/cook-smart.git
cd cook-smart

# Install dependencies
npm install

# Backend setup
cd backend
cp .env.example .env.secure
# Edit .env.secure with your configuration
npm install
npm run dev

# Mobile app setup (new terminal)
cd ..
npx react-native run-android
```

### Environment Configuration

Create `backend/.env.secure` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cooksmartdb

# APIs
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret

# Stripe (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# See .env.example for complete configuration
```

## 📚 Documentation

### For Developers

- [**API Documentation**](docs/api/) - Complete REST API reference
- [**Database Schema**](docs/database/) - Entity relationships and migrations
- [**Security Guide**](SECURITY_IMPLEMENTATION.md) - Security practices and compliance
- [**Deployment Guide**](docs/deployment/) - Production deployment procedures

### For Users

- [**User Guide**](docs/user-guide/) - Application usage instructions
- [**FAQ**](docs/faq.md) - Frequently asked questions
- [**Privacy Policy**](docs/legal/PRIVACY_POLICY.md) - Data handling practices
- [**Terms of Service**](docs/legal/TERMS_OF_SERVICE.md) - Usage terms and conditions

## 🔒 Security

Cook Smart implements the following security measures:

- **🔐 Authentication** - JWT-based authentication with secure session management
- **🚫 Input Validation** - Sanitization and validation on API inputs
- **📊 Audit Logging** - Audit trail for user actions

## 🧪 Testing & Quality Assurance

```bash
# Run test suite
npm test

# Run integration tests
npm run test:integration

# Run security audit
npm audit
```

The backend has 104 tests. The mobile app has 7 tests. The website has ~200 tests (some flaky). Coverage is growing but not yet measured as a single percentage.

**Quality Gates**: Automated testing on all pull requests (CI runs lint, type-check, and tests)
**Code Quality**: ESLint + Prettier + TypeScript strict mode

## 🚀 Deployment

### Backend

```bash
# SSH to EC2 and pull latest
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
cd /home/ubuntu/cook-smart/backend/backend
git pull
npm run build
pm2 restart cook-smart-backend
```

### Mobile App

```bash
# Build release APK
cd android && ./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
# Distribution is manual
```

## 🤝 Contributing

This is a proprietary project with controlled access. For authorized contributors:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Standards

- Follow TypeScript strict mode
- Use conventional commit messages
- Pass all quality gates and security scans

## 📄 License

This project is proprietary software. All rights reserved.

**Copyright © 2025 Cook Smart Technologies**

Unauthorized copying, distribution, or modification of this software is strictly prohibited. See [LICENSE](LICENSE) for details.

## 🆘 Support

### For Users

- **📧 Email**: services.cooksmart@gmail.com
- **💬 Discord**: [Community Server](https://discord.gg/7mAeMvjGVH)
- **📖 Documentation**: [User Guide](docs/user-guide/)

### For Developers

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/mikeartee/cook-smart/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/mikeartee/cook-smart/discussions)
- **📧 Technical Support**: services.cooksmart@gmail.com

---

<div align="center">

**Built with ❤️ by the Cook Smart Team**

[Community](https://discord.gg/7mAeMvjGVH) • [Support](mailto:services.cooksmart@gmail.com)

</div>
