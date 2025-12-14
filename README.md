# BorderRelief Donations Platform

A humanitarian-first, offline-ready donation management system.

## 🏗 Project Structure

- **apps/api**: NestJS Backend (RBAC, Logistics, StockLedger)
- **apps/web**: Next.js PWA (Offline Intake, Dashboard)
- **apps/ml**: Python FastAPI (Explainable AI)
- **docker-compose.yml**: Infrastructure (Postgres, Redis, MinIO)

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Running the Stack

```bash
# 1. Start Infrastructure & Apps
docker-compose up -d --build

# 2. Verify Services
# API:     http://localhost:3001/api
# Web:     http://localhost:3002
# ML:      http://localhost:5001/health
# MinIO:   http://localhost:9001 (Console)
```

### Local Development

#### Backend (API)
```bash
cd apps/api
npm install
npx prisma generate
npx prisma db push # Sync DB
npm run start:dev
```

#### Frontend (Web)
```bash
cd apps/web
npm install
npm run dev
```

## 🔐 Security Defaults
- Check `threat_model_privacy.md` for policy.
- All PII is masked by default on API responses.
- Audit logs are immutable (AuditInterceptor).

## 📡 Offline Sync
Frontend uses local IndexedDB (Dexie). Actions are queued in `outbox` table and synced when `window.onLine`.
