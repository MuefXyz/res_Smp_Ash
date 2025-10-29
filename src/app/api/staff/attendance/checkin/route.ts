import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const staffId = decoded.id;
    const now = new Date();
    
    // Set waktu ke start of day untuk comparison
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Cek apakah sudah check-in hari ini
    const existingLog = await db.teacherAttendanceLog.findFirst({
      where: {
        teacherId: staffId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingLog && existingLog.checkInTime) {
      return NextResponse.json({ 
        error: "Already checked in today" 
      }, { status: 409 });
    }

    // Update atau buat log kehadiran
    let attendanceLog;
    if (existingLog) {
      attendanceLog = await db.teacherAttendanceLog.update({
        where: { id: existingLog.id },
        data: {
          checkInTime: now,
          status: "HADIR",
          isScheduled: false, // Staff tidak perlu jadwal
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
    } else {
      attendanceLog = await db.teacherAttendanceLog.create({
        data: {
          teacherId: staffId,
          date: now,
          checkInTime: now,
          status: "HADIR",
          isScheduled: false, // Staff tidak perlu jadwal
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
    }

    return NextResponse.json({
      message: "Check-in successful",
      attendance: attendanceLog,
      schedule: "Staff Duty"
    });

  } catch (error) {
    console.error("Error checking in:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
