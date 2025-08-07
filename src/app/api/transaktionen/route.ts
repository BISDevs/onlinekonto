import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all transaktionen or by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    const whereClause = userId ? { userId: userId } : {};

    const transaktionen = await prisma.transaktion.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        anlage: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        datum: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    });

    const formattedTransaktionen = transaktionen.map(transaktion => ({
      id: transaktion.id,
      anlage_id: transaktion.anlageId,
      user_id: transaktion.userId,
      typ: transaktion.typ.toLowerCase(),
      betrag: transaktion.betrag,
      datum: transaktion.datum.toISOString(),
      beschreibung: transaktion.beschreibung,
      user: transaktion.user,
      anlage: transaktion.anlage,
    }));

    return NextResponse.json(formattedTransaktionen);

  } catch (error) {
    console.error('Get transaktionen error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Transaktionen' },
      { status: 500 }
    );
  }
}

// POST create new transaktion
export async function POST(request: NextRequest) {
  try {
    const {
      anlageId,
      userId,
      typ,
      betrag,
      beschreibung,
    } = await request.json();

    if (!userId || !typ || !betrag) {
      return NextResponse.json(
        { error: 'Benutzer-ID, Typ und Betrag sind erforderlich' },
        { status: 400 }
      );
    }

    // Create transaktion
    const transaktion = await prisma.transaktion.create({
      data: {
        anlageId: anlageId ? parseInt(anlageId) : null,
        userId: userId,
        typ: typ.toUpperCase(),
        betrag: parseFloat(betrag),
        beschreibung,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        anlage: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: transaktion.id,
      anlage_id: transaktion.anlageId,
      user_id: transaktion.userId,
      typ: transaktion.typ.toLowerCase(),
      betrag: transaktion.betrag,
      datum: transaktion.datum.toISOString(),
      beschreibung: transaktion.beschreibung,
      user: transaktion.user,
      anlage: transaktion.anlage,
    });

  } catch (error) {
    console.error('Create transaktion error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Transaktion' },
      { status: 500 }
    );
  }
}
