import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = verifyToken(token);
    
    if (!staff || staff.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
    }
    
    // Set waktu ke start of day untuk comparison
    const today = new Date(targetDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get attendance log for today
    const attendanceLog = await db.teacherAttendanceLog.findFirst({
      where: {
        teacherId: staff.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Get absence record for today
    const absenceRecord = await db.absence.findFirst({
      where: {
        userId: staff.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const result = {
      id: attendanceLog?.id || "",
      date: today.toISOString(),
      checkInTime: attendanceLog?.checkInTime?.toISOString() || undefined,
      checkOutTime: attendanceLog?.checkOutTime?.toISOString() || undefined,
      status: absenceRecord?.status || attendanceLog?.status || "BELUM_ABSEN",
      isScheduled: attendanceLog?.isScheduled || false
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching staff attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
