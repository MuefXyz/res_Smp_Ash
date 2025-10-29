import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/admin/extracurriculars/[id]/members/[memberId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    // Check if extracurricular exists
    const extracurricular = await db.extracurricular.findUnique({
      where: { id: params.id },
    });

    if (!extracurricular) {
      return NextResponse.json(
        { error: 'Ekstrakurikuler tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if member exists
    const member = await db.extracurricularMember.findUnique({
      where: { id: params.memberId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify member belongs to this extracurricular
    if (member.extracurricularId !== params.id) {
      return NextResponse.json(
        { error: 'Anggota tidak terdaftar dalam ekstrakurikuler ini' },
        { status: 400 }
      );
    }

    await db.extracurricularMember.delete({
      where: { id: params.memberId },
    });

    return NextResponse.json(
      { 
        message: `Anggota ${member.student.name} (${member.student.nis}) berhasil dikeluarkan dari ekstrakurikuler` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing extracurricular member:', error);
    return NextResponse.json(
      { error: 'Gagal mengeluarkan anggota ekstrakurikuler' },
      { status: 500 }
    );
  }
}