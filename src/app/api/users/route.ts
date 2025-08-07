import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountNumber: true,
        kycStatus: true,
        street: true,
        postalCode: true,
        city: true,
        country: true,
        referenceIban: true,
        referenceBic: true,
        referenceBankName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedUsers = users.map(user => ({
      ...user,
      role: user.role.toLowerCase(),
      kycStatus: user.kycStatus.toLowerCase(),
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedUsers);

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Benutzer' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      role = 'user',
      accountNumber,
      kycStatus = 'pending',
      street,
      postalCode,
      city,
      country = 'Deutschland',
      referenceIban,
      referenceBic,
      referenceBankName,
    } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name und E-Mail sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail existiert bereits' },
        { status: 409 }
      );
    }

    // Generate default password
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role.toUpperCase(),
        accountNumber: accountNumber || `OK-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        kycStatus: kycStatus.toUpperCase(),
        street: street || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        country: country || 'Deutschland',
        referenceIban: referenceIban || undefined,
        referenceBic: referenceBic || undefined,
        referenceBankName: referenceBankName || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountNumber: true,
        kycStatus: true,
        street: true,
        postalCode: true,
        city: true,
        country: true,
        referenceIban: true,
        referenceBic: true,
        referenceBankName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...user,
      role: user.role.toLowerCase(),
      kycStatus: user.kycStatus.toLowerCase(),
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Benutzers' },
      { status: 500 }
    );
  }
}
