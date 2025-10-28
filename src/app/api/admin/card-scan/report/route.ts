import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest
) {
  console.log("=== CARD SCAN REPORT GET REQUEST ===");
  
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
    const reportType = searchParams.get('type') || 'daily'; // daily, weekly, monthly
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateFrom) {
      startDate = new Date(dateFrom);
    } else {
      switch (reportType) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate.setDate(now.getDate() - 30);
          break;
      }
    }

    if (dateTo) {
      endDate = new Date(dateTo);
    } else {
      endDate = now;
    }

    // Get comprehensive scan data
    const [
      totalScans,
      checkInCount,
      checkOutCount,
      uniqueUsers,
      dailyStats,
      userStats,
      locationStats,
      hourlyStats
    ] = await Promise.all([
      // Total scans
      db.cardScan.count({
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Check in count
      db.cardScan.count({
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          },
          scanType: 'CHECK_IN'
        }
      }),
      
      // Check out count
      db.cardScan.count({
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          },
          scanType: 'CHECK_OUT'
        }
      }),
      
      // Unique users
      db.cardScan.groupBy({
        by: ['userId'],
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Daily statistics
      db.cardScan.groupBy({
        by: ['scanType'],
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        }
      }),
      
      // User statistics
      db.cardScan.groupBy({
        by: ['userId'],
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
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
        take: 20
      }),
      
      // Location statistics
      db.cardScan.groupBy({
        by: ['location'],
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          },
          location: {
            not: null
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
      }),
      
      // Hourly statistics
      db.cardScan.findMany({
        where: {
          scanTime: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          scanTime: true,
          scanType: true
        }
      })
    ]);

    // Get user details for user stats
    const topUserIds = userStats.map(s => s.userId);
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

    // Process hourly data
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      checkIn: 0,
      checkOut: 0
    }));

    hourlyStats.forEach(scan => {
      const hour = new Date(scan.scanTime).getHours();
      if (scan.scanType === 'CHECK_IN') {
        hourlyData[hour].checkIn++;
      } else {
        hourlyData[hour].checkOut++;
      }
    });

    // Combine user stats with details
    const userStatistics = userStats.map(stat => {
      const userInfo = topUsers.find(u => u.id === stat.userId);
      return {
        userId: stat.userId,
        userName: userInfo?.name || 'Unknown',
        userRole: userInfo?.role || 'Unknown',
        scanCount: stat._count.id,
        nis: userInfo?.nis,
        nip: userInfo?.nip,
      };
    });

    // Generate daily breakdown
    const dailyBreakdown = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const [dayScans, dayCheckIn, dayCheckOut] = await Promise.all([
        db.cardScan.count({
          where: {
            scanTime: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        }),
        db.cardScan.count({
          where: {
            scanTime: {
              gte: dayStart,
              lte: dayEnd
            },
            scanType: 'CHECK_IN'
          }
        }),
        db.cardScan.count({
          where: {
            scanTime: {
              gte: dayStart,
              lte: dayEnd
            },
            scanType: 'CHECK_OUT'
          }
        })
      ]);
      
      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        totalScans: dayScans,
        checkIn: dayCheckIn,
        checkOut: dayCheckOut
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const report = {
      reportType,
      dateRange: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalScans,
        checkInCount,
        checkOutCount,
        uniqueUsers: uniqueUsers.length,
        averageScansPerDay: Math.round(totalScans / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      },
      dailyBreakdown,
      userStatistics,
      locationStatistics: locationStats,
      hourlyDistribution: hourlyData,
      generatedAt: new Date()
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error("Error generating card scan report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}