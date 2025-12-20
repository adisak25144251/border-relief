# GovTrip Intelligence

🚀 **Enterprise-Grade Government Trip Management System with AI Analytics**

ระบบจัดการการเดินทางราชการแบบครบวงจร พร้อมการวิเคราะห์ด้วย AI สำหรับหน่วยงานภาครัฐไทย

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## ✨ Features

- 📍 **GPS Tracking**: ติดตามเส้นทางแบบเรียลไทม์ด้วย Hybrid Satellite Maps (Leaflet)
- 🤖 **AI Analytics**: วิเคราะห์รูปแบบ, ตรวจจับความผิดปกติ, สรุปข้อมูลอัจฉริยะ
- 💰 **Cost Management**: คำนวณต้นทุนครบวงจร (น้ำมัน, ค่าเสื่อม, บำรุงรักษา)
- 🌱 **ESG Tracking**: Carbon Footprint & ESG Scoring
- 🔒 **PDPA Compliant**: ระบบปกป้องข้อมูลส่วนบุคคลตามกฎหมาย
- 📊 **Advanced Reporting**: รายงานครบวงจร PDF/Excel/KML/GeoJSON
- 🛡️ **Audit Trail**: บันทึกทุกการดำเนินการแบบ tamper-proof

## 🏗️ Architecture

```
GovTrip-Intelligence/
├── apps/
│   └── web/              # Next.js Application
│       ├── app/
│       │   ├── components/
│       │   ├── lib/      # Library Modules
│       │   │   ├── imports/   # GPX, KML, GeoJSON, CSV
│       │   │   ├── exports/   # PDF, Excel, KML, Share Links
│       │   │   ├── ai/        # ML Features, Clustering, Anomaly
│       │   │   ├── cost/      # Calculator, Fuel, CO2, ESG
│       │   │   ├── privacy/   # PII Masking, Redaction
│       │   │   ├── audit/     # Logging, Immutable Records
│       │   │   └── utils/     # Zod, Dates, IDs
│       │   └── govtrip/       # Main Application
│       └── prisma/            # Database Schema
├── packages/
│   └── shared/                # Shared Types & Schemas
├── docker/                    # Docker Configuration
├── scripts/                   # Development Scripts
└── docs/                      # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- PostgreSQL 15+ (via Docker)
- Git

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/your-org/govtrip-intelligence.git
cd govtrip-intelligence
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Development** (Windows)
```powershell
.\scripts\dev.ps1
```

4. **Access Application**
- Main: http://localhost:3000
- GovTrip: http://localhost:3000/govtrip

## 📚 Documentation

- [Product Requirements (PRD)](./docs/PRD.md)
- [API Documentation](./docs/API.md)
- [Security Guidelines](./docs/SECURITY.md)
- [Data Quality Specs](./docs/DATA-QUALITY.md)
- [Deployment Guide](./docs/DEPLOY.md)

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js (Hybrid Satellite)
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Database**: PostgreSQL 15 + PostGIS
- **ORM**: Prisma
- **Caching**: Redis
- **Validation**: Zod

### Infrastructure
- **Container**: Docker & Docker Compose
- **Deployment**: Vercel / Self-hosted

## 📊 Database Schema

```prisma
model Trip {
  id              String
  tripNumber      String  // T-XXXX
  title           String
  startLocation   String
  endLocation     String
  distance        Float
  totalCost       Float
  status          TripStatus
  driver          User
  vehicle         Vehicle
  gpsPoints       GPSPoint[]
  costs           CostRecord[]
}
```

[View Full Schema](./apps/web/prisma/schema.prisma)

## 🔐 Security

- **Authentication**: JWT-based
- **Authorization**: RBAC (Admin, Manager, Driver, Auditor)
- **Data Protection**: PII Masking, Encryption (AES-256)
- **Compliance**: PDPA, ISO 27001 aligned
- **Audit**: Immutable logs with 10-year retention

[Full Security Guidelines](./docs/SECURITY.md)

## 🌍 Sustainability (ESG)

Track and report environmental impact:
- CO2 emissions per trip
- Carbon offset recommendations
- ESG scoring (A+ to F)
- Tree planting calculator

## 📝 License

MIT License - see [LICENSE](./LICENSE)

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📧 Contact

- **Email**: support@govtrip.go.th
- **Security**: security@govtrip.go.th
- **PDPA Officer**: dpo@govtrip.go.th

---

**Built with ❤️ for Thai Government Agencies**
