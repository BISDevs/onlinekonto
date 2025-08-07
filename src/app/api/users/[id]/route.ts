import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { Role, KycStatus } from '@prisma/client';

// GET user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id; // No need to parse since it's now a string

    if (!userId) {
      return NextResponse.json(
        { error: 'Ungültige Benutzer-ID' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            anlagen: true,
            transaktionen: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      role: user.role.toLowerCase(),
      kycStatus: user.kycStatus.toLowerCase(),
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      stats: {
        anlagenCount: user._count.anlagen,
        transaktionenCount: user._count.transaktionen,
      },
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Benutzers' },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id; // No need to parse since it's now a string
    const {
      name,
      email,
      role,
      password,
      accountNumber,
      kycStatus,
      street,
      postalCode,
      city,
      country,
      referenceIban,
      referenceBic,
      referenceBankName,
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Ungültige Benutzer-ID' },
        { status: 400 }
      );
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name und E-Mail sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: userId },
      },
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: 'Diese E-Mail wird bereits verwendet' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: {
      name: string;
      email: string;
      role?: Role;
      password?: string;
      accountNumber?: string;
      kycStatus?: KycStatus;
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      referenceIban?: string;
      referenceBic?: string;
      referenceBankName?: string;
    } = {
      name,
      email: email.toLowerCase(),
    };

    if (role) {
      updateData.role = role.toUpperCase() as Role;
    }

    if (accountNumber) {
      updateData.accountNumber = accountNumber;
    }

    if (kycStatus) {
      updateData.kycStatus = kycStatus.toUpperCase();
    }

    // Address fields
    if (street !== undefined) updateData.street = street || undefined;
    if (postalCode !== undefined) updateData.postalCode = postalCode || undefined;
    if (city !== undefined) updateData.city = city || undefined;
    if (country !== undefined) updateData.country = country || undefined;

    // Reference account fields
    if (referenceIban !== undefined) updateData.referenceIban = referenceIban || undefined;
    if (referenceBic !== undefined) updateData.referenceBic = referenceBic || undefined;
    if (referenceBankName !== undefined) updateData.referenceBankName = referenceBankName || undefined;

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
      ...updatedUser,
      role: updatedUser.role.toLowerCase(),
      kycStatus: updatedUser.kycStatus.toLowerCase(),
      created_at: updatedUser.createdAt.toISOString(),
      updated_at: updatedUser.updatedAt.toISOString(),
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Benutzers' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Ungültige Benutzer-ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        anlagen: true,
        transaktionen: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Prevent deletion of admin users if they're the last admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Der letzte Administrator kann nicht gelöscht werden' },
          { status: 409 }
        );
      }
    }

    // Check for active anlagen
    const activeAnlagen = existingUser.anlagen.filter(a => a.status === 'AKTIV');
    if (activeAnlagen.length > 0) {
      return NextResponse.json(
        { error: 'Benutzer mit aktiven Anlagen können nicht gelöscht werden' },
        { status: 409 }
      );
    }

    // Delete user (cascade will handle anlagen and transaktionen)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Benutzer erfolgreich gelöscht' });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Benutzers' },
      { status: 500 }
    );
  }
}
