# Deployment Guide - GovTrip Intelligence

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or later / Windows Server 2019+
- **CPU**: 4 cores minimum (8+ recommended)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 50GB minimum (SSD recommended)
- **Network**: Static IP, ports 80/443 open

### Software Requirements
- Node.js 18.x or later
- PostgreSQL 15.x
- Redis 7.x (optional, but recommended)
- Docker & Docker Compose (recommended)
- Nginx or similar reverse proxy

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/govtrip-intelligence.git
cd govtrip-intelligence
```

#### Step 2: Environment Configuration
```bash
cp .env.example .env
nano .env  # Edit with your configuration
```

Required environment variables:
```env
DATABASE_URL="postgresql://govtrip:STRONG_PASSWORD@localhost:5432/govtrip"
NEXTAUTH_SECRET="GENERATE_WITH_openssl_rand_base64_32"
NEXTAUTH_URL="https://your-domain.go.th"
NODE_ENV="production"
```

#### Step 3: Start Services
```bash
# Start Docker services
docker-compose -f docker/docker-compose.yml up -d

# Wait for PostgreSQL
sleep 10

# Run migrations
cd apps/web
npx prisma migrate deploy
npx prisma generate
```

#### Step 4: Build Application
```bash
npm run build
```

#### Step 5: Start Production Server
```bash
npm run start
```

### Option 2: Manual Deployment

#### Step 1: Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib postgis

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE govtrip;
CREATE USER govtrip WITH ENCRYPTED PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE govtrip TO govtrip;
\q
```

#### Step 2: Install Node.js
```bash
# Using NodeSource PPA
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be 18.x+
npm --version
```

#### Step 3: Install Redis (Optional)
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Step 4: Clone & Install
```bash
git clone https://github.com/your-org/govtrip-intelligence.git
cd govtrip-intelligence/apps/web
npm install
```

#### Step 5: Configure & Build
```bash
cp .env.example .env
nano .env  # Update DATABASE_URL and other vars

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Build
npm run build
```

#### Step 6: Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "govtrip" -- start

# Enable startup script
pm2 startup
pm2 save
```

## Nginx Configuration

### SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.go.th
```

### Nginx Config
```nginx
# /etc/nginx/sites-available/govtrip

upstream govtrip_app {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.go.th;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.go.th;

    ssl_certificate /etc/letsencrypt/live/your-domain.go.th/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.go.th/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://govtrip_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/govtrip /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Database Management

### Backup Script
```bash
#!/bin/bash
# /opt/govtrip/backup.sh

BACKUP_DIR="/backups/govtrip"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="govtrip_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U govtrip -h localhost govtrip > "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/govtrip/backup.sh >> /var/log/govtrip-backup.log 2>&1
```

### Restore from Backup
```bash
gunzip backup_file.sql.gz
psql -U govtrip -h localhost govtrip < backup_file.sql
```

## Monitoring & Logging

### Application Logs
```bash
# PM2 logs
pm2 logs govtrip

# Export logs
pm2 logs govtrip --lines 1000 > /var/log/govtrip/app.log
```

### System Monitoring
```bash
# CPU & Memory
pm2 monit

# Disk usage
df -h

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='govtrip';"
```

### Log Rotation
```bash
# /etc/logrotate.d/govtrip

/var/log/govtrip/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_trips_date ON trips(departure_date);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_gps_trip ON gps_points(trip_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Analyze tables
ANALYZE trips;
ANALYZE gps_points;
ANALYZE audit_logs;

-- Vacuum
VACUUM ANALYZE;
```

### Next.js Optimization
```javascript
// next.config.js additions
module.exports = {
  compress: true,
  generateEtags: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Production optimization
  productionBrowserSourceMaps: false,
  swcMinify: true,
};
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable firewall (ufw)
- [ ] Configure fail2ban
- [ ] SSL/TLS certificates installed
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Backup encryption enabled
- [ ] Audit logging active
- [ ] Rate limiting configured

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U govtrip -h localhost -d govtrip

# View logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. Application Won't Start
```bash
# Check logs
pm2 logs govtrip --err

# Check port availability
sudo netstat -tulpn | grep 3000

# Restart
pm2 restart govtrip
```

#### 3. High Memory Usage
```bash
# Check memory
free -h

# Restart services
pm2 restart govtrip
sudo systemctl restart postgresql
```

## Updates & Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart govtrip
```

### System Updates
```bash
# Update packages
sudo apt update
sudo apt upgrade

# Reboot if kernel updated
sudo reboot
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Redis for session management
- Read replicas for database
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Enable caching (Redis)
- Compression enabled

## Support & Contacts

- **Technical Support**: support@govtrip.go.th
- **Emergency Hotline**: +66-x-xxxx-xxxx
- **Documentation**: https://docs.govtrip.go.th
- **Issue Tracker**: https://github.com/your-org/govtrip/issues

---

**Last Updated**: 2025-01-21  
**Version**: 1.0  
**Maintained By**: DevOps Team
