import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all anlagen or by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const whereClause = userId ? { userId: userId } : {};

    const anlagen = await prisma.festgeldAnlage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedAnlagen = anlagen.map(anlage => ({
      id: anlage.id,
      user_id: anlage.userId,
      betrag: anlage.betrag,
      zinssatz: anlage.zinssatz,
      laufzeit_monate: anlage.laufzeitMonate,
      start_datum: anlage.startDatum.toISOString().split('T')[0],
      end_datum: anlage.endDatum.toISOString().split('T')[0],
      zinsbetrag: anlage.zinsbetrag,
      endbetrag: anlage.endbetrag,
      status: anlage.status.toLowerCase(),
      created_at: anlage.createdAt.toISOString(),
      updated_at: anlage.updatedAt.toISOString(),
      user: anlage.user,
    }));

    return NextResponse.json(formattedAnlagen);

  } catch (error) {
    console.error('Get anlagen error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Anlagen' },
      { status: 500 }
    );
  }
}

// POST create new anlage
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      betrag,
      zinssatz,
      laufzeitMonate,
      startDatum,
    } = await request.json();

    if (!userId || !betrag || !zinssatz || !laufzeitMonate || !startDatum) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      );
    }

    // Calculate end date
    const start = new Date(startDatum);
    const end = new Date(start);
    end.setMonth(end.getMonth() + laufzeitMonate);

    // Calculate interest
    const zinsbetrag = (betrag * zinssatz * laufzeitMonate) / (100 * 12);
    const endbetrag = betrag + zinsbetrag;

    // Create anlage
    const anlage = await prisma.festgeldAnlage.create({
      data: {
        userId: userId,
        betrag: parseFloat(betrag),
        zinssatz: parseFloat(zinssatz),
        laufzeitMonate: parseInt(laufzeitMonate),
        startDatum: start,
        endDatum: end,
        zinsbetrag: Math.round(zinsbetrag * 100) / 100,
        endbetrag: Math.round(endbetrag * 100) / 100,
        status: 'AKTIV',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create initial transaction
    await prisma.transaktion.create({
      data: {
        anlageId: anlage.id,
        userId: anlage.userId,
        typ: 'EINZAHLUNG',
        betrag: anlage.betrag,
        beschreibung: `Einzahlung für Festgeldanlage #${anlage.id}`,
      },
    });

    return NextResponse.json({
      id: anlage.id,
      user_id: anlage.userId,
      betrag: anlage.betrag,
      zinssatz: anlage.zinssatz,
      laufzeit_monate: anlage.laufzeitMonate,
      start_datum: anlage.startDatum.toISOString().split('T')[0],
      end_datum: anlage.endDatum.toISOString().split('T')[0],
      zinsbetrag: anlage.zinsbetrag,
      endbetrag: anlage.endbetrag,
      status: anlage.status.toLowerCase(),
      created_at: anlage.createdAt.toISOString(),
      updated_at: anlage.updatedAt.toISOString(),
      user: anlage.user,
    });

  } catch (error) {
    console.error('Create anlage error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Anlage' },
      { status: 500 }
    );
  }
}
