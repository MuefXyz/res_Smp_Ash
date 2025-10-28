import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest
) {
  console.log("=== CARD SCAN STATISTICS GET REQUEST ===");
  
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    // Get various statistics
    const [
      totalScans,
      checkInCount,
      checkOutCount,
      uniqueUsers,
      recentScans,
      scansByUser
    ] = await Promise.all([
      // Total scans in period
      db.cardScan.count({
        where: {
          scanTime: {
            gte: startDate
          }
        }
      }),
      
      // Check in count
      db.cardScan.count({
        where: {
          scanTime: {
            gte: startDate
          },
          scanType: 'CHECK_IN'
        }
      }),
      
      // Check out count
      db.cardScan.count({
        where: {
          scanTime: {
            gte: startDate
          },
          scanType: 'CHECK_OUT'
        }
      }),
      
      // Unique users scanned
      db.cardScan.groupBy({
        by: ['userId'],
        where: {
          scanTime: {
            gte: startDate
          }
        }
      }),
      
      // Recent scans (last 10)
      db.cardScan.findMany({
        take: 10,
        orderBy: {
          scanTime: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            }
          }
        }
      }),
      
      // Scans grouped by user
      db.cardScan.groupBy({
        by: ['userId'],
        where: {
          scanTime: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Get user details for top scanners
    const topUserIds = scansByUser.map(s => s.userId);
    const topUsers = await db.user.findMany({
      where: {
        id: {
          in: topUserIds
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        nis: true,
        nip: true,
      }
    });

    // Combine scan counts with user details
    const topScanners = scansByUser.map(scan => {
      const userInfo = topUsers.find(u => u.id === scan.userId);
      return {
        userId: scan.userId,
        userName: userInfo?.name || 'Unknown',
        userRole: userInfo?.role || 'Unknown',
        scanCount: scan._count.id,
        nis: userInfo?.nis,
        nip: userInfo?.nip,
      };
    });

    const statistics = {
      period,
      dateRange: {
        start: startDate,
        end: now
      },
      overview: {
        totalScans,
        checkInCount,
        checkOutCount,
        uniqueUsers: uniqueUsers.length
      },
      recentScans,
      topScanners
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error("Error fetching card scan statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}