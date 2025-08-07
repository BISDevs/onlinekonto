# Onlinekonto - Online Banking System

A modern, secure online banking application built with Next.js, featuring comprehensive user management, fixed deposit administration, and extended user profiles.

## 🌟 Features

### 🔐 Authentication & Security
- Secure login system with bcrypt password hashing
- Role-based access control (Admin/User)
- Session management with localStorage
- No registration endpoint (admin-only user creation)

### 👨‍💼 Extended User Profiles
- **Personal Information**: Name, email, role
- **Address Data**: Street, postal code, city, country
- **Banking Information**: Alphanumeric account numbers (OK-2025-XXX)
- **KYC Status**: Verification tracking (pending, verified, rejected, incomplete)
- **Reference Account**: IBAN, BIC, bank name for transfers

### 🏦 Banking Features
- **Fixed Deposits (Festgeld)**: Create and manage term deposits
- **Interest Calculation**: Automatic calculation with compound interest
- **Transaction History**: Complete audit trail
- **Real-time Statistics**: Investment summaries and analytics
- **Interest Calculator**: Standalone tool for calculations

### 🛠️ Admin Panel
- **User Management**: Full CRUD operations for users
- **Deposit Management**: Complete fixed deposit administration
- **Real-time Statistics**: User counts, investment volumes, active deposits
- **Advanced Filtering**: Search and filter by various criteria

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Prisma ORM with SQLite (development)
- **Authentication**: Custom implementation with bcrypt
- **Package Manager**: Bun
- **Deployment**: Vercel (recommended) / Netlify

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/onlinekonto.git
   cd onlinekonto
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up the database:**
   ```bash
   bunx prisma generate
   bunx prisma db push
   bunx prisma db seed
   ```

4. **Run the development server:**
   ```bash
   bun run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Demo Credentials

After seeding the database, use these credentials:

- **Admin**: admin@onlinekonto.de / admin123
- **User**: user@onlinekonto.de / user123
- **Pending KYC**: thomas@onlinekonto.de / demo123

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── dashboard/         # User dashboard
│   ├── profil/            # User profile
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/                # shadcn/ui components
│   ├── admin/             # Admin-specific components
│   └── layout/            # Layout components
├── lib/                   # Utility functions
│   ├── auth-context.tsx   # Authentication context
│   ├── api-storage.ts     # API functions
│   ├── types.ts           # TypeScript types
│   └── account-utils.ts   # Banking utilities
└── prisma/                # Database schema and migrations
    ├── schema.prisma      # Database schema
    ├── seed.ts           # Database seeding
    └── migrations/        # Migration files
```

## 🏗️ Database Schema

### User Model
- Extended with address information
- KYC status tracking
- Alphanumeric account numbers
- Reference account details

### FestgeldAnlage (Fixed Deposits)
- Investment amount and terms
- Interest rate and calculation
- Status tracking (active, completed, early termination)

### Transaktion (Transactions)
- Complete transaction history
- Type classification (deposit, withdrawal, interest)
- Linked to users and deposits

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build
```bash
# Build for production
bun run build

# Start production server
bun start
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./prisma/onlinekonto.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📊 Features Overview

### User Features
- Clean, professional dashboard
- Personal profile management
- Fixed deposit overview
- Transaction history
- Interest calculator

### Admin Features
- User management with extended profiles
- Fixed deposit administration
- Real-time system statistics
- Advanced search and filtering
- Comprehensive CRUD operations

## 🔒 Security Features

- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Secure API endpoints
- Session management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database management with [Prisma](https://prisma.io/)
- Icons from [Lucide React](https://lucide.dev/)

---

**Onlinekonto** - Secure, modern online banking for the digital age.
