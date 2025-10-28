# 🏫 SMP ASH SOLIHIN - Sistem Manajemen Sekolah

Sistem manajemen sekolah modern yang komprehensif dengan fitur absensi berbasis kartu, manajemen user, dan tracking real-time.

## ✨ Fitur Utama

### 🎯 Core Features
- **👥 Manajemen User** - Admin, Guru, Siswa, Staff, TU dengan role-based access
- **🆔 Card ID System** - Generate dan manage kartu identitas dengan QR Code
- **📱 Card Scan System** - Absensi real-time berbasis kartu dengan Check In/Out
- **📊 Dashboard Analytics** - Statistik lengkap dan reporting
- **🔔 Real-time Notifications** - Notifikasi instan menggunakan Socket.IO
- **📈 Comprehensive Reports** - Laporan harian, mingguan, bulanan

### 🛠️ Technical Stack
- **⚡ Next.js 15** dengan App Router
- **📘 TypeScript 5** untuk type safety
- **🎨 Tailwind CSS 4** + shadcn/ui components
- **🗄️ Prisma ORM** dengan SQLite database
- **🔐 NextAuth.js** untuk authentication
- **🌐 Socket.IO** untuk real-time features
- **📊 React Hook Form** + Zod validation
- **🎯 Zustand** untuk state management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Clone repository
git clone https://github.com/MuefXyz/Smp-Ash.git
cd Smp-Ash

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Setup database
npm run db:push

# Start development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

## 🔧 Environment Variables

### Development (.env.local)

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-development-key-change-this-in-production"

# JWT Secret
JWT_SECRET="your-jwt-secret-for-development"

# Application Settings
NODE_ENV="development"
PORT=3000

# Socket.IO (untuk real-time notifications)
SOCKET_IO_PORT=3000

# File Upload (untuk avatar, dll.)
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880  # 5MB

# Email Configuration (opsional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL="admin@smp-ash.sch.id"

# Z.ai AI SDK (untuk fitur AI)
Z_AI_API_KEY="your-z-ai-api-key"

# Development Settings
DEBUG=true
LOG_LEVEL="debug"
```

### Production (.env.production)

```bash
# Database - Production Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/smp_ash_prod"
# Atau untuk SQLite production:
# DATABASE_URL="file:./prod.db"

# NextAuth.js Configuration - HARUS DIUBAH!
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-production-secret-key-min-32-chars"

# JWT Secret - HARUS DIUBAH!
JWT_SECRET="your-super-secure-jwt-secret-for-production-min-32-chars"

# Application Settings
NODE_ENV="production"
PORT=3000

# Socket.IO Production
SOCKET_IO_PORT=3000
SOCKET_IO_CORS_ORIGIN="https://your-domain.com"

# File Upload Production
UPLOAD_DIR="/var/www/uploads"
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES="jpg,jpeg,png,pdf"

# Email Configuration - RECOMMENDED FOR PRODUCTION
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="admin@smp-ash.sch.id"
FROM_NAME="SMP ASH SOLIHIN"

# SSL Configuration (jika menggunakan HTTPS)
SSL_CERT_PATH="/path/to/cert.pem"
SSL_KEY_PATH="/path/to/key.pem"

# Security Headers
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring & Logging
LOG_LEVEL="info"
SENTRY_DSN="your-sentry-dsn-for-error-tracking"

# Z.ai AI SDK Production
Z_AI_API_KEY="your-production-z-ai-api-key"

# Backup Configuration
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_PATH="/var/backups/smp-ash"

# Cache Configuration
REDIS_URL="redis://localhost:6379"
CACHE_TTL=3600  # 1 hour

# Production Security
CORS_ORIGIN="https://your-domain.com"
TRUST_PROXY=true
DISABLE_X_POWERED_BY=true
```

### Environment Variables untuk Docker (.env.docker)

```bash
# Docker Configuration
DATABASE_URL="postgresql://postgres:password@db:5432/smp_ash"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="docker-secret-key-change-in-production"
JWT_SECRET="docker-jwt-secret-change-in-production"

# Docker Settings
NODE_ENV="production"
PORT=3000

# Database Docker
POSTGRES_DB=smp_ash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis Docker (optional)
REDIS_URL="redis://redis:6379"
```

## 📁 Database Setup

### Development (SQLite)
```bash
# Push schema ke SQLite
npm run db:push

# View database
npm run db:studio
```

### Production (PostgreSQL)
```bash
# Install PostgreSQL client
npm install pg

# Update .env.production dengan PostgreSQL URL
DATABASE_URL="postgresql://username:password@localhost:5432/smp_ash_prod"

# Generate Prisma Client
npx prisma generate

# Push schema ke production database
npm run db:push

# Atau gunakan migration untuk production
npx prisma migrate deploy
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
# Build aplikasi
npm run build

# Start production server
npm start

# Atau menggunakan PM2
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
# Build image
docker build -t smp-ash .

# Run container
docker run -p 3000:3000 --env-file .env.docker smp-ash

# Atau gunakan docker-compose
docker-compose up -d
```

### Deployment Options

#### 1. Vercel (Recommended untuk Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy ke Vercel
vercel --prod

# Setup environment variables di Vercel Dashboard
```

#### 2. DigitalOcean App Platform
```bash
# Install doctl
curl -sSL https://github.com/digitalocean/doctl/releases/latest/download/doctl-linux-amd64.tar.gz | tar xz
sudo mv doctl /usr/local/bin/

# Deploy
doctl apps create --spec app.yaml
```

#### 3. AWS EC2
```bash
# Connect ke EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Setup application
git clone https://github.com/MuefXyz/Smp-Ash.git
cd Smp-Ash
npm install
npm run build

# Setup PM2
npm install -g pm2
pm2 start ecosystem.config.js

# Setup nginx sebagai reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/smp-ash
```

#### 4. Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login dan deploy
railway login
railway init
railway up
```

#### 5. Heroku
```bash
# Install Heroku CLI
# Login ke Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set NEXTAUTH_SECRET=your-secret
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

## 📊 Default Users

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: ADMIN

### Test Users
- **Guru**: guru@example.com / guru123
- **Siswa**: siswa@example.com / siswa123
- **Staff**: staff@example.com / staff123

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `GET /api/auth/me` - Get current user

### Admin Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Card Management
- `POST /api/admin/users/[userId]/card` - Assign card ID
- `GET /api/admin/users/[userId]/card` - Get card info

### Card Scan System
- `POST /api/admin/card-scan` - Process card scan
- `GET /api/admin/card-scan` - Get scan history
- `GET /api/admin/card-scan/statistics` - Get statistics
- `GET /api/admin/card-scan/report` - Generate reports

## 🎯 Cara Penggunaan

### 1. Manajemen User
1. Login sebagai admin
2. Go to Admin Dashboard → Manajemen User
3. Add/Edit/Delete users dengan role berbeda

### 2. Card ID Assignment
1. Go to Card ID tab
2. Click icon 📇 pada user
3. Generate atau input Card ID manual
4. Download QR Code PDF

### 3. Card Scan Absensi
1. Go to Card Scan tab
2. Quick Scan: Input Card ID + Enter
3. Advanced Scan: Pilih tipe, lokasi, catatan
4. Monitor real-time notifications

### 4. Reporting
1. View statistics cards
2. Filter scan history
3. Generate comprehensive reports
4. Export data untuk analysis

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Production
npm run build        # Build optimized version
npm run start        # Start production server
```

## 🔒 Security Configuration

### Production Security Checklist
- [ ] Ubah `NEXTAUTH_SECRET` dan `JWT_SECRET`
- [ ] Gunakan HTTPS di production
- [ ] Setup proper CORS origins
- [ ] Enable rate limiting
- [ ] Setup monitoring dan logging
- [ ] Regular database backups
- [ ] Update dependencies regularly
- [ ] Use environment variables untuk sensitive data

### Environment Security
```bash
# Generate secure secrets
openssl rand -base64 32  # Untuk NEXTAUTH_SECRET
openssl rand -base64 32  # Untuk JWT_SECRET

# File permissions
chmod 600 .env.production
chmod 600 .env.local
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check database URL di .env
   echo $DATABASE_URL
   
   # Reset database
   npm run db:push -- --force-reset
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Atau gunakan port berbeda
   PORT=3001 npm run dev
   ```

3. **Socket.IO Connection Issues**
   ```bash
   # Check CORS configuration
   # Verify NEXTAUTH_URL matches domain
   ```

4. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📝 Monitoring & Logging

### Development Logs
```bash
# View development logs
tail -f dev.log

# View database queries
DEBUG=prisma:query npm run dev
```

### Production Monitoring
- Setup error tracking dengan Sentry
- Monitor application performance
- Regular log rotation
- Database performance monitoring

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Project ini dilisensikan under MIT License - lihat [LICENSE](LICENSE) file untuk details.

## 📞 Support

Untuk support atau questions:
- Email: admin@smp-ash.sch.id
- GitHub Issues: [Create Issue](https://github.com/MuefXyz/Smp-Ash/issues)
- Documentation: [Wiki](https://github.com/MuefXyz/Smp-Ash/wiki)

---

🏫 **SMP ASH SOLIHIN** - Sistem Manajemen Sekolah Modern

Built with ❤️ untuk pendidikan Indonesia 🇮🇩