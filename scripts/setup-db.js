#!/usr/bin/env node

/**
 * Database Setup Script for Vercel PostgreSQL
 * Run this after creating the PostgreSQL database on Vercel
 */

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function setupDatabase() {
  console.log('🔧 Setting up Onlinekonto database...');

  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable not found');
      console.log('Please ensure you have created a PostgreSQL database on Vercel');
      process.exit(1);
    }

    console.log('✅ DATABASE_URL found');

    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('bunx prisma generate');
    console.log('✅ Prisma client generated');

    // Deploy migrations
    console.log('🚀 Deploying database migrations...');
    await execAsync('bunx prisma migrate deploy');
    console.log('✅ Migrations deployed');

    // Seed database
    console.log('🌱 Seeding database with demo data...');
    await execAsync('bunx prisma db seed');
    console.log('✅ Database seeded');

    console.log('\n🎉 Database setup complete!');
    console.log('\n🔑 Demo Credentials:');
    console.log('- Admin: admin@onlinekonto.de / admin123');
    console.log('- User: user@onlinekonto.de / user123');
    console.log('- Pending KYC: thomas@onlinekonto.de / demo123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);

    if (error.message.includes('P1001')) {
      console.log('\n💡 This might be a connection issue. Make sure:');
      console.log('1. PostgreSQL database is created on Vercel');
      console.log('2. DATABASE_URL environment variable is set');
      console.log('3. Database is accessible from your current location');
    }

    process.exit(1);
  }
}

// Run setup
setupDatabase();
