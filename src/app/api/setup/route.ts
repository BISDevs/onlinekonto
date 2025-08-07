import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateAccountNumber } from '@/lib/account-utils';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function createTablesAndSeedData() {
  console.log('🔧 Starting database setup...');

  // Create tables manually with raw SQL
  try {
    console.log('📦 Creating database enums and tables...');

    // Create enums first
    await prisma.$executeRaw`
      CREATE TYPE IF NOT EXISTS "role" AS ENUM ('USER', 'ADMIN');
    `;

    await prisma.$executeRaw`
      CREATE TYPE IF NOT EXISTS "kyc_status" AS ENUM ('pending', 'verified', 'rejected', 'incomplete');
    `;

    await prisma.$executeRaw`
      CREATE TYPE IF NOT EXISTS "anlage_status" AS ENUM ('aktiv', 'beendet', 'vorzeitig_beendet');
    `;

    await prisma.$executeRaw`
      CREATE TYPE IF NOT EXISTS "transaktion_typ" AS ENUM ('einzahlung', 'auszahlung', 'zinsgutschrift');
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "role" "role" NOT NULL DEFAULT 'USER',
        "account_number" TEXT NOT NULL UNIQUE,
        "kyc_status" "kyc_status" NOT NULL DEFAULT 'pending',
        "street" TEXT,
        "postal_code" TEXT,
        "city" TEXT,
        "country" TEXT DEFAULT 'Deutschland',
        "reference_iban" TEXT,
        "reference_bic" TEXT,
        "reference_bank_name" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "festgeld_anlagen" (
        "id" SERIAL NOT NULL,
        "user_id" TEXT NOT NULL,
        "betrag" DOUBLE PRECISION NOT NULL,
        "zinssatz" DOUBLE PRECISION NOT NULL,
        "laufzeit_monate" INTEGER NOT NULL,
        "start_datum" TIMESTAMP(3) NOT NULL,
        "end_datum" TIMESTAMP(3) NOT NULL,
        "zinsbetrag" DOUBLE PRECISION NOT NULL,
        "endbetrag" DOUBLE PRECISION NOT NULL,
        "status" "anlage_status" NOT NULL DEFAULT 'aktiv',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "festgeld_anlagen_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "transaktionen" (
        "id" SERIAL NOT NULL,
        "anlage_id" INTEGER,
        "user_id" TEXT NOT NULL,
        "typ" "transaktion_typ" NOT NULL,
        "betrag" DOUBLE PRECISION NOT NULL,
        "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "beschreibung" TEXT,
        CONSTRAINT "transaktionen_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('✅ Database tables created');
  } catch (error) {
    console.log('Table creation error:', error);
    throw error;
  }

  // Check if database is already seeded
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    return {
      message: 'Database is already initialized',
      users: existingUsers,
      already_setup: true
    };
  }

  console.log('🌱 Seeding database with demo data...');

  // Create demo users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@onlinekonto.de',
      password: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
      accountNumber: generateAccountNumber(),
      kycStatus: 'VERIFIED',
      street: 'Hauptstraße 1',
      postalCode: '10115',
      city: 'Berlin',
      country: 'Deutschland',
      referenceIban: 'DE89370400440532013000',
      referenceBic: 'COBADEFFXXX',
      referenceBankName: 'Commerzbank AG'
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Max Mustermann',
      email: 'user@onlinekonto.de',
      password: await bcrypt.hash('user123', 12),
      role: 'USER',
      accountNumber: generateAccountNumber(),
      kycStatus: 'VERIFIED',
      street: 'Musterstraße 123',
      postalCode: '80331',
      city: 'München',
      country: 'Deutschland',
      referenceIban: 'DE89370400440532013001',
      referenceBic: 'COBADEFFXXX',
      referenceBankName: 'Deutsche Bank AG'
    }
  });

  const pendingUser = await prisma.user.create({
    data: {
      name: 'Thomas Weber',
      email: 'thomas@onlinekonto.de',
      password: await bcrypt.hash('demo123', 12),
      role: 'USER',
      accountNumber: generateAccountNumber(),
      kycStatus: 'PENDING',
      street: 'Testweg 456',
      postalCode: '22767',
      city: 'Hamburg',
      country: 'Deutschland'
    }
  });

  // Create demo fixed deposits
  const anlage1 = await prisma.festgeldAnlage.create({
    data: {
      userId: regularUser.id,
      betrag: 10000,
      zinssatz: 3.5,
      laufzeitMonate: 12,
      startDatum: new Date('2024-01-01'),
      endDatum: new Date('2025-01-01'),
      zinsbetrag: 350,
      endbetrag: 10350,
      status: 'AKTIV'
    }
  });

  const anlage2 = await prisma.festgeldAnlage.create({
    data: {
      userId: regularUser.id,
      betrag: 25000,
      zinssatz: 4.2,
      laufzeitMonate: 24,
      startDatum: new Date('2024-06-01'),
      endDatum: new Date('2026-06-01'),
      zinsbetrag: 2100,
      endbetrag: 27100,
      status: 'AKTIV'
    }
  });

  // Create demo transactions
  await prisma.transaktion.create({
    data: {
      userId: regularUser.id,
      anlageId: anlage1.id,
      typ: 'EINZAHLUNG',
      betrag: 10000,
      datum: new Date('2024-01-01'),
      beschreibung: 'Festgeldanlage 12 Monate'
    }
  });

  await prisma.transaktion.create({
    data: {
      userId: regularUser.id,
      anlageId: anlage2.id,
      typ: 'EINZAHLUNG',
      betrag: 25000,
      datum: new Date('2024-06-01'),
      beschreibung: 'Festgeldanlage 24 Monate'
    }
  });

  console.log('✅ Database initialized successfully!');

  return {
    message: 'Database initialized successfully!',
    tables_created: true,
    users: 3,
    anlagen: 2,
    transaktionen: 2,
    credentials: {
      admin: 'admin@onlinekonto.de / admin123',
      user: 'user@onlinekonto.de / user123',
      pending: 'thomas@onlinekonto.de / demo123'
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const result = await createTablesAndSeedData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database initialization error:', error);

    return NextResponse.json(
      {
        error: 'Database initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'Check Vercel function logs for details'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to check database status, but if tables don't exist, create them
    try {
      const userCount = await prisma.user.count();
      const anlageCount = await prisma.festgeldAnlage.count();

      // If tables exist but are empty, seed them
      if (userCount === 0) {
        console.log('Database tables exist but are empty, seeding data...');
        const result = await createTablesAndSeedData();
        return NextResponse.json({
          ...result,
          auto_setup: true,
          note: 'Database was automatically seeded via GET request'
        });
      }

      return NextResponse.json({
        status: 'Database ready',
        users: userCount,
        anlagen: anlageCount,
        ready: true
      });
    } catch (error) {
      // Tables don't exist, so create them
      console.log('Tables do not exist, creating them...');
      const result = await createTablesAndSeedData();
      return NextResponse.json({
        ...result,
        auto_setup: true,
        note: 'Database was automatically initialized via GET request'
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'Database setup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
