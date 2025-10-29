# SMP Ash - School Management System

A comprehensive school management system built with Next.js 15, TypeScript, and modern web technologies.

## 🚀 Features

### Attendance Management
- **Teacher Attendance**: Complete attendance tracking with schedule integration
- **Staff Attendance**: Employee attendance system with QR code scanning
- **Real-time Updates**: Live attendance status and statistics
- **Monthly Reports**: Comprehensive attendance reports and analytics

### User Management
- **Role-based Access**: Admin, Teacher, and Staff roles
- **Secure Authentication**: NextAuth.js integration
- **Profile Management**: User profile and account settings

### Dashboard & Analytics
- **Statistics Overview**: Real-time attendance statistics
- **Data Visualization**: Charts and graphs for insights
- **Export Functionality**: PDF and Excel export capabilities

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS 4 with shadcn/ui
- **Authentication**: NextAuth.js v4
- **State Management**: Zustand + TanStack Query
- **UI Components**: shadcn/ui with Lucide icons

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/MuefXyz/Smp-Ash.git
cd Smp-Ash

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

## 🗄️ Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations (if needed)
npm run db:migrate
```

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

## 📊 Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── admin/          # Admin-specific components
│   ├── guru/           # Teacher components
│   └── staff/          # Staff components
├── lib/                # Utility functions and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

## 🎯 Key Features

### Attendance System
- QR code-based attendance scanning
- Schedule-based attendance validation
- Real-time status updates
- Monthly attendance recap
- Export to PDF/Excel

### User Roles
- **Admin**: Full system access and user management
- **Teacher**: Attendance management and class monitoring
- **Staff**: Personal attendance tracking

### Security
- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team.

---

**Built with ❤️ using Next.js 15 and modern web technologies**