import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AnlageStatus } from '@prisma/client';

// GET anlage by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anlageId = parseInt(id);

    if (isNaN(anlageId)) {
      return NextResponse.json(
        { error: 'Ungültige Anlagen-ID' },
        { status: 400 }
      );
    }

    const anlage = await prisma.festgeldAnlage.findUnique({
      where: { id: anlageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transaktionen: {
          orderBy: {
            datum: 'desc',
          },
        },
      },
    });

    if (!anlage) {
      return NextResponse.json(
        { error: 'Anlage nicht gefunden' },
        { status: 404 }
      );
    }

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
      transaktionen: anlage.transaktionen.map(t => ({
        id: t.id,
        anlage_id: t.anlageId,
        user_id: t.userId,
        typ: t.typ.toLowerCase(),
        betrag: t.betrag,
        datum: t.datum.toISOString(),
        beschreibung: t.beschreibung,
      })),
    });

  } catch (error) {
    console.error('Get anlage by ID error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Anlage' },
      { status: 500 }
    );
  }
}

// PUT update anlage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anlageId = parseInt(id);
    const {
      betrag,
      zinssatz,
      laufzeitMonate,
      startDatum,
      status,
    } = await request.json();

    if (isNaN(anlageId)) {
      return NextResponse.json(
        { error: 'Ungültige Anlagen-ID' },
        { status: 400 }
      );
    }

    // Check if anlage exists
    const existingAnlage = await prisma.festgeldAnlage.findUnique({
      where: { id: anlageId },
    });

    if (!existingAnlage) {
      return NextResponse.json(
        { error: 'Anlage nicht gefunden' },
        { status: 404 }
      );
    }

    // Prevent editing of completed anlagen
    if (existingAnlage.status === 'BEENDET' || existingAnlage.status === 'VORZEITIG_BEENDET') {
      return NextResponse.json(
        { error: 'Beendete Anlagen können nicht bearbeitet werden' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: {
      betrag?: number;
      zinssatz?: number;
      laufzeitMonate?: number;
      startDatum?: Date;
      endDatum?: Date;
      status?: AnlageStatus;
      zinsbetrag?: number;
      endbetrag?: number;
    } = {};

    if (betrag !== undefined) {
      updateData.betrag = parseFloat(betrag);
    }

    if (zinssatz !== undefined) {
      updateData.zinssatz = parseFloat(zinssatz);
    }

    if (laufzeitMonate !== undefined) {
      updateData.laufzeitMonate = parseInt(laufzeitMonate);
    }

    if (startDatum !== undefined) {
      updateData.startDatum = new Date(startDatum);
      // Recalculate end date
      const start = new Date(startDatum);
      const end = new Date(start);
      end.setMonth(end.getMonth() + (laufzeitMonate || existingAnlage.laufzeitMonate));
      updateData.endDatum = end;
    }

    if (status !== undefined) {
      updateData.status = status.toUpperCase() as AnlageStatus;
    }

    // Recalculate interest if financial parameters changed
    if (betrag !== undefined || zinssatz !== undefined || laufzeitMonate !== undefined) {
      const finalBetrag = betrag !== undefined ? parseFloat(betrag) : existingAnlage.betrag;
      const finalZinssatz = zinssatz !== undefined ? parseFloat(zinssatz) : existingAnlage.zinssatz;
      const finalLaufzeit = laufzeitMonate !== undefined ? parseInt(laufzeitMonate) : existingAnlage.laufzeitMonate;

      const zinsbetrag = (finalBetrag * finalZinssatz * finalLaufzeit) / (100 * 12);
      const endbetrag = finalBetrag + zinsbetrag;

      updateData.zinsbetrag = Math.round(zinsbetrag * 100) / 100;
      updateData.endbetrag = Math.round(endbetrag * 100) / 100;
    }

    // Update anlage
    const updatedAnlage = await prisma.festgeldAnlage.update({
      where: { id: anlageId },
      data: updateData,
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

    // Create transaction if status changed to ended
    if (status && (status.toUpperCase() === 'BEENDET' || status.toUpperCase() === 'VORZEITIG_BEENDET')) {
      await prisma.transaktion.create({
        data: {
          anlageId: anlageId,
          userId: updatedAnlage.userId,
          typ: 'AUSZAHLUNG',
          betrag: updatedAnlage.endbetrag,
          beschreibung: `Auszahlung der ${status.toUpperCase() === 'VORZEITIG_BEENDET' ? 'vorzeitig ' : ''}beendeten Festgeldanlage #${anlageId}`,
        },
      });
    }

    return NextResponse.json({
      id: updatedAnlage.id,
      user_id: updatedAnlage.userId,
      betrag: updatedAnlage.betrag,
      zinssatz: updatedAnlage.zinssatz,
      laufzeit_monate: updatedAnlage.laufzeitMonate,
      start_datum: updatedAnlage.startDatum.toISOString().split('T')[0],
      end_datum: updatedAnlage.endDatum.toISOString().split('T')[0],
      zinsbetrag: updatedAnlage.zinsbetrag,
      endbetrag: updatedAnlage.endbetrag,
      status: updatedAnlage.status.toLowerCase(),
      created_at: updatedAnlage.createdAt.toISOString(),
      updated_at: updatedAnlage.updatedAt.toISOString(),
      user: updatedAnlage.user,
    });

  } catch (error) {
    console.error('Update anlage error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Anlage' },
      { status: 500 }
    );
  }
}

// DELETE anlage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anlageId = parseInt(id);

    if (isNaN(anlageId)) {
      return NextResponse.json(
        { error: 'Ungültige Anlagen-ID' },
        { status: 400 }
      );
    }

    // Check if anlage exists
    const existingAnlage = await prisma.festgeldAnlage.findUnique({
      where: { id: anlageId },
      include: {
        transaktionen: true,
      },
    });

    if (!existingAnlage) {
      return NextResponse.json(
        { error: 'Anlage nicht gefunden' },
        { status: 404 }
      );
    }

    // Prevent deletion of active anlagen
    if (existingAnlage.status === 'AKTIV') {
      return NextResponse.json(
        { error: 'Aktive Anlagen können nicht gelöscht werden. Beenden Sie die Anlage zuerst.' },
        { status: 409 }
      );
    }

    // Delete anlage (cascade will handle transaktionen)
    await prisma.festgeldAnlage.delete({
      where: { id: anlageId },
    });

    return NextResponse.json({ message: 'Anlage erfolgreich gelöscht' });

  } catch (error) {
    console.error('Delete anlage error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Anlage' },
      { status: 500 }
    );
  }
}
