'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, LogIn, LogOut, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceStatus {
  today: {
    date: string;
    hasSchedule: boolean;
    schedule?: {
      dayOfWeek: number;
      dayName: string;
      subject: string;
      room?: string;
    };
    attendance?: {
      status: string;
      checkInTime?: string;
      checkOutTime?: string;
      notes?: string;
    };
    canCheckIn: boolean;
    canCheckOut: boolean;
  };
  weekHistory: Array<{
    date: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }>;
}

export default function AttendanceTracker() {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchAttendanceStatus();
    
    // Refresh setiap menit
    const interval = setInterval(fetchAttendanceStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendanceStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/guru/attendance/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus(data);
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        toast.error('Gagal memuat status kehadiran');
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      toast.error('Gagal memuat status kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/guru/attendance/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Check-in berhasil! ${data.schedule}`);
        fetchAttendanceStatus();
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal check-in');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Terjadi kesalahan saat check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/guru/attendance/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Check-out berhasil!');
        fetchAttendanceStatus();
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal check-out');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Terjadi kesalahan saat check-out');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HADIR':
        return <Badge className="bg-green-500">Hadir</Badge>;
      case 'SAKIT':
        return <Badge className="bg-yellow-500">Sakit</Badge>;
      case 'IZIN':
        return <Badge className="bg-blue-500">Izin</Badge>;
      case 'ALPA':
        return <Badge className="bg-red-500">Alpa</Badge>;
      default:
        return <Badge variant="secondary">Tidak diketahui</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!attendanceStatus) {
    return <div className="text-center p-8 text-gray-500">Tidak ada data kehadiran</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Hari Ini */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jadwal Hari Ini */}
            <div>
              <h3 className="font-semibold mb-3">Jadwal</h3>
              {attendanceStatus.today.hasSchedule ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">Hari:</span>
                    <span className="ml-2 font-medium">
                      {attendanceStatus.today.schedule?.dayName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">Mata Pelajaran:</span>
                    <span className="ml-2 font-medium">
                      {attendanceStatus.today.schedule?.subject}
                    </span>
                  </div>
                  {attendanceStatus.today.schedule?.room && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Ruangan:</span>
                      <span className="ml-2 font-medium">
                        {attendanceStatus.today.schedule.room}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Tidak ada jadwal hari ini</p>
              )}
            </div>

            {/* Status Kehadiran */}
            <div>
              <h3 className="font-semibold mb-3">Status Kehadiran</h3>
              {attendanceStatus.today.attendance ? (
                <div className="space-y-2">
                  <div>{getStatusBadge(attendanceStatus.today.attendance.status)}</div>
                  {attendanceStatus.today.attendance.checkInTime && (
                    <div className="flex items-center text-sm">
                      <LogIn className="w-4 h-4 mr-1 text-green-500" />
                      Check-in: {formatTime(attendanceStatus.today.attendance.checkInTime)}
                    </div>
                  )}
                  {attendanceStatus.today.attendance.checkOutTime && (
                    <div className="flex items-center text-sm">
                      <LogOut className="w-4 h-4 mr-1 text-blue-500" />
                      Check-out: {formatTime(attendanceStatus.today.attendance.checkOutTime)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Belum ada catatan kehadiran</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            {attendanceStatus.today.canCheckIn && (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="bg-green-500 hover:bg-green-600"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {checkingIn ? 'Checking in...' : 'Check In'}
              </Button>
            )}
            {attendanceStatus.today.canCheckOut && (
              <Button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {checkingOut ? 'Checking out...' : 'Check Out'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Minggu Ini */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Minggu Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceStatus.weekHistory.length > 0 ? (
              attendanceStatus.weekHistory.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{formatDate(log.date)}</div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {log.checkInTime && (
                        <span className="flex items-center">
                          <LogIn className="w-3 h-3 mr-1" />
                          {formatTime(log.checkInTime)}
                        </span>
                      )}
                      {log.checkOutTime && (
                        <span className="flex items-center">
                          <LogOut className="w-3 h-3 mr-1" />
                          {formatTime(log.checkOutTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Belum ada riwayat kehadiran minggu ini</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}