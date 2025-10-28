'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, CheckCircle, LogOut, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  room?: string;
  subject?: {
    id: string;
    name: string;
  };
}

interface AttendanceLog {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA';
  notes?: string;
  isScheduled: boolean;
  overtimeHours?: number;
}

interface WeekData {
  date: string;
  dayName: string;
  dayOfWeek: number;
  schedule?: Schedule;
  attendance?: AttendanceLog;
  isToday: boolean;
}

const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const statusColors = {
  HADIR: 'default',
  SAKIT: 'secondary',
  IZIN: 'outline',
  ALPHA: 'destructive'
} as const;

const statusLabels = {
  HADIR: 'Hadir',
  SAKIT: 'Sakit',
  IZIN: 'Izin',
  ALPHA: 'Alpha'
} as const;

export default function TeacherAttendance() {
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAttendanceData();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [currentWeekOffset]);

  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/guru/attendance?weekOffset=${currentWeekOffset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeekData(data.weekData);
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/guru/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'check-in' })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchAttendanceData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal check-in');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/guru/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'check-out' })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchAttendanceData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal check-out');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const getTodayData = () => {
    return weekData.find(day => day.isToday);
  };

  const getWeekStats = () => {
    const totalDays = weekData.length;
    const presentDays = weekData.filter(day => day.attendance?.status === 'HADIR').length;
    const scheduledDays = weekData.filter(day => day.schedule).length;
    const overtimeHours = weekData.reduce((total, day) => 
      total + (day.attendance?.overtimeHours || 0), 0
    );

    return {
      totalDays,
      presentDays,
      scheduledDays,
      overtimeHours,
      attendanceRate: scheduledDays > 0 ? (presentDays / scheduledDays) * 100 : 0
    };
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  };

  const canCheckIn = () => {
    const today = getTodayData();
    return today && !today.attendance?.checkInTime;
  };

  const canCheckOut = () => {
    const today = getTodayData();
    return today && today.attendance?.checkInTime && !today.attendance?.checkOutTime;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const today = getTodayData();
  const stats = getWeekStats();

  return (
    <div className="space-y-6">
      {/* Header with Current Time */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kehadiran Guru</h2>
          <p className="text-gray-600">
            {currentTime.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {currentTime.toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          <div className="text-sm text-gray-600">Waktu Lokal</div>
        </div>
      </div>

      {/* Today's Status */}
      {today && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Status Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Jadwal</div>
                <div className="text-lg font-semibold">
                  {today.schedule ? (
                    <div>
                      <div>{dayNames[today.dayOfWeek]}</div>
                      <div className="text-sm text-blue-600">
                        {today.schedule.startTime} - {today.schedule.endTime}
                      </div>
                      {today.schedule.subject && (
                        <div className="text-sm text-gray-500">
                          {today.schedule.subject.name}
                        </div>
                      )}
                      {today.schedule.room && (
                        <div className="text-sm text-gray-500">
                          Ruang: {today.schedule.room}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">Tidak ada jadwal</span>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Status Kehadiran</div>
                <div className="text-lg font-semibold">
                  {today.attendance ? (
                    <div>
                      <Badge variant={statusColors[today.attendance.status]}>
                        {statusLabels[today.attendance.status]}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-1">
                        {!today.attendance.isScheduled && '(Lu Jadwal)'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Belum dicatat</span>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Jam Kerja</div>
                <div className="text-lg font-semibold">
                  {today.attendance?.checkInTime && today.attendance?.checkOutTime ? (
                    <div>
                      <div>{formatTime(today.attendance.checkInTime)} - {formatTime(today.attendance.checkOutTime)}</div>
                      {today.attendance.overtimeHours && today.attendance.overtimeHours > 0 && (
                        <div className="text-sm text-green-600">
                          +{today.attendance.overtimeHours.toFixed(1)} jam lembur
                        </div>
                      )}
                    </div>
                  ) : today.attendance?.checkInTime ? (
                    <div>
                      <div>Masuk: {formatTime(today.attendance.checkInTime)}</div>
                      <div className="text-sm text-orange-600">Belum check-out</div>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Check-in/Check-out Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              {canCheckIn() && (
                <Button onClick={handleCheckIn} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              )}
              {canCheckOut() && (
                <Button onClick={handleCheckOut} variant="outline">
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Hadir</div>
                <div className="text-2xl font-bold">{stats.presentDays}/{stats.scheduledDays}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Tingkat Kehadiran</div>
                <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Lembur</div>
                <div className="text-2xl font-bold">{stats.overtimeHours.toFixed(1)} jam</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Minggu</div>
                <div className="text-2xl font-bold">
                  {currentWeekOffset === 0 ? 'Ini' : currentWeekOffset > 0 ? `+${currentWeekOffset}` : currentWeekOffset}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
        >
          Minggu Sebelumnya
        </Button>
        <h3 className="text-lg font-semibold">
          {currentWeekOffset === 0 ? 'Minggu Ini' : `Minggu ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
        </h3>
        <Button 
          variant="outline" 
          onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
        >
          Minggu Berikutnya
        </Button>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Mingguan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekData.map((day) => (
              <div 
                key={day.date} 
                className={`border rounded-lg p-3 ${day.isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="text-center mb-2">
                  <div className="font-semibold">{day.dayName}</div>
                  <div className="text-sm text-gray-600">{formatDate(day.date)}</div>
                </div>
                
                {day.schedule ? (
                  <div className="text-sm">
                    <div className="text-blue-600 font-medium">
                      {day.schedule.startTime} - {day.schedule.endTime}
                    </div>
                    {day.schedule.subject && (
                      <div className="text-gray-600 truncate">
                        {day.schedule.subject.name}
                      </div>
                    )}
                    {day.schedule.room && (
                      <div className="text-gray-500">
                        {day.schedule.room}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center">
                    Tidak ada jadwal
                  </div>
                )}
                
                {day.attendance && (
                  <div className="mt-2 pt-2 border-t">
                    <Badge variant={statusColors[day.attendance.status]} className="text-xs">
                      {statusLabels[day.attendance.status]}
                    </Badge>
                    {!day.attendance.isScheduled && (
                      <div className="text-xs text-gray-500 mt-1">Lu Jadwal</div>
                    )}
                    {day.attendance.overtimeHours && day.attendance.overtimeHours > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        +{day.attendance.overtimeHours.toFixed(1)} jam
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}