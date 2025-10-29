'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  Check
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  nip: string;
  email: string;
  role: string;
  schedules: TeacherSchedule[];
}

interface TeacherSchedule {
  dayOfWeek: number;
  subject: string | null;
  room: string | null;
}

interface AttendanceRecord {
  teacherId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'HADIR' | 'ALPHA' | 'TERLAMBAT' | 'IZIN' | 'SAKIT';
  notes?: string;
}

interface MonthlyData {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  month: number;
  year: number;
}

const statusColors = {
  HADIR: 'bg-green-100 text-green-800',
  ALPHA: 'bg-red-100 text-red-800',
  TERLAMBAT: 'bg-yellow-100 text-yellow-800',
  IZIN: 'bg-blue-100 text-blue-800',
  SAKIT: 'bg-purple-100 text-purple-800'
};

const statusIcons = {
  HADIR: CheckCircle,
  ALPHA: XCircle,
  TERLAMBAT: Clock,
  IZIN: Calendar,
  SAKIT: Clock
};

export default function RekapKehadiran() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const monthYear = formatDate(currentDate);
      const response = await fetch(`/api/admin/rekap-kehadiran?month=${monthYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getAttendanceForDate = (teacherId: string, day: number) => {
    if (!monthlyData) return null;
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthlyData.attendance.find(
      record => record.teacherId === teacherId && record.date === dateStr
    );
  };

  const getTeacherAttendanceCount = (teacherId: string) => {
    if (!monthlyData) return 0;
    return monthlyData.attendance.filter(
      record => record.teacherId === teacherId && record.status === 'HADIR'
    ).length;
  };

  // Get scheduled days for a teacher in the current month
  const getScheduledDaysForTeacher = (teacherId: string) => {
    if (!monthlyData) return [];
    
    const teacher = monthlyData.teachers.find(t => t.id === teacherId);
    if (!teacher || !teacher.schedules.length) {
      // Fallback: return all days of the month if no schedules found
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
    
    const daysInMonth = getDaysInMonth(currentDate);
    const scheduledDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 (Monday-Sunday)
      
      // Check if teacher has schedule on this day
      const hasSchedule = teacher.schedules.some(schedule => schedule.dayOfWeek === adjustedDayOfWeek);
      if (hasSchedule) {
        scheduledDays.push(day);
      }
    }
    
    // Fallback: if no scheduled days found, return all days
    if (scheduledDays.length === 0) {
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
    
    return scheduledDays;
  };

  // Get all unique scheduled days across all teachers for the current month
  const getAllScheduledDays = () => {
    if (!monthlyData) return [];
    
    const allDays = new Set<number>();
    
    monthlyData.teachers.forEach(teacher => {
      const scheduledDays = getScheduledDaysForTeacher(teacher.id);
      scheduledDays.forEach(day => allDays.add(day));
    });
    
    const result = Array.from(allDays).sort((a, b) => a - b);
    
    // If no scheduled days found, return all days of the month as fallback
    if (result.length === 0) {
      const allDaysOfMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      return allDaysOfMonth;
    }
    
    return result;
  };

  // Check if a specific day is scheduled for a teacher
  const isDayScheduledForTeacher = (teacherId: string, day: number) => {
    if (!monthlyData) return true; // Fallback: assume all days are scheduled
    
    const teacher = monthlyData.teachers.find(t => t.id === teacherId);
    if (!teacher || !teacher.schedules.length) return true; // Fallback: assume all days are scheduled
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    return teacher.schedules.some(schedule => schedule.dayOfWeek === adjustedDayOfWeek);
  };

  const getStatistics = () => {
    if (!monthlyData) return { total: 0, hadir: 0, alpha: 0, terlambat: 0, ijin: 0, sakit: 0 };

    const stats = monthlyData.attendance.reduce((acc, record) => {
      acc.total++;
      const status = record.status.toLowerCase();
      if (status === 'hadir') acc.hadir++;
      else if (status === 'alpha') acc.alpha++;
      else if (status === 'terlambat') acc.terlambat++;
      else if (status === 'izin') acc.ijin++;
      else if (status === 'sakit') acc.sakit++;
      return acc;
    }, { total: 0, hadir: 0, alpha: 0, terlambat: 0, ijin: 0, sakit: 0 });

    return {
      total: stats.total,
      hadir: stats.hadir,
      alpha: stats.alpha,
      terlambat: stats.terlambat,
      ijin: stats.ijin,
      sakit: stats.sakit
    };
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export functionality
    console.log('Export to Excel');
  };

  const filteredTeachers = monthlyData?.teachers.filter(teacher => {
    if (selectedStatus === 'ALL') return true;
    
    const teacherAttendance = monthlyData.attendance.filter(
      record => record.teacherId === teacher.id
    );
    
    return teacherAttendance.some(record => record.status === selectedStatus);
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getStatistics();
  const daysInMonth = getDaysInMonth(currentDate);
  const scheduledDays = getAllScheduledDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg shadow-md">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Rekap Kehadiran Guru</h1>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <span className="font-medium">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="hover:bg-blue-50 text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow-sm">
                {monthNames[currentDate.getMonth()].substring(0, 3)} {currentDate.getFullYear()}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="hover:bg-blue-50 text-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToExcel}
                className="hover:bg-green-50 text-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Guru</p>
                <p className="text-xl font-bold text-gray-900">{monthlyData?.teachers.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Hadir</p>
                <p className="text-xl font-bold text-green-600">{stats.hadir}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Alpa</p>
                <p className="text-xl font-bold text-red-600">{stats.alpha}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Terlambat</p>
                <p className="text-xl font-bold text-yellow-600">{stats.terlambat}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Izin</p>
                <p className="text-xl font-bold text-blue-600">{stats.ijin}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Sakit</p>
                <p className="text-xl font-bold text-purple-600">{stats.sakit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Filter className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Filter Status</h3>
                <p className="text-xs text-gray-500">Saring data berdasarkan status kehadiran</p>
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="ALL">📊 Semua Status</option>
              <option value="HADIR">✅ Hadir</option>
              <option value="ALPHA">❌ Alpa</option>
              <option value="TERLAMBAT">⏰ Terlambat</option>
              <option value="IZIN">📄 Izin</option>
              <option value="SAKIT">🏥 Sakit</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-blue-600 rounded">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                Tabel Kehadiran Guru
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Rekap kehadiran guru untuk <span className="font-semibold text-blue-600">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <div className="text-xs mt-1">
                  Menampilkan {scheduledDays.length} hari jadwal dari {daysInMonth} hari bulan ini
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{filteredTeachers.length} guru</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-b from-gray-50 to-white border-b-2 border-gray-200">
                  <th className="border-l border-t border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-900 bg-gradient-to-r from-blue-50 to-transparent">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Nama Guru
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900 bg-gradient-to-r from-gray-50 to-transparent">
                    NIP
                  </th>
                  {scheduledDays.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                    const dayName = dayNames[date.getDay()];
                    
                    return (
                      <th
                        key={day}
                        className={`border border-gray-200 px-1 py-3 text-center font-semibold text-xs min-w-[45px] ${
                          isWeekend ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500">{dayName}</span>
                          <span className="font-bold">{day}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="border-r border-t border-b border-gray-200 px-4 py-3 text-center font-bold text-white bg-gradient-to-r from-green-500 to-green-600 shadow-sm">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Jumlah Hadir
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, index) => {
                  const attendanceCount = getTeacherAttendanceCount(teacher.id);
                  return (
                    <tr 
                      key={teacher.id} 
                      className={`transition-all duration-150 hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="border-l border-t border-b border-gray-200 px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {teacher.name}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center font-mono text-sm text-gray-700">
                        {teacher.nip}
                      </td>
                      {scheduledDays.map(day => {
                        const attendance = getAttendanceForDate(teacher.id, day);
                        const isScheduled = isDayScheduledForTeacher(teacher.id, day);
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        
                        return (
                          <td
                            key={day}
                            className={`border border-gray-200 px-1 py-2 text-center transition-colors duration-150 ${
                              isWeekend ? 'bg-red-50/30' : ''
                            } ${!isScheduled ? 'bg-gray-100' : ''} ${attendance ? 'hover:bg-gray-100' : ''}`}
                          >
                            {isScheduled ? (
                              attendance && attendance.status === 'HADIR' ? (
                                <div className="flex justify-center">
                                  <div className="p-1 bg-green-100 rounded-full">
                                    <Check className="h-3 w-3 text-green-600" />
                                  </div>
                                </div>
                              ) : attendance ? (
                                <div className="flex justify-center">
                                  <div className="p-1 bg-red-100 rounded-full">
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-3 w-3 mx-auto rounded-full bg-orange-200"></div>
                              )
                            ) : (
                              <div className="h-3 w-3 mx-auto rounded-full bg-gray-300"></div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border-r border-t border-b border-gray-200 px-4 py-3 text-center bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-bold text-green-700">{attendanceCount}</span>
                          <span className="text-xs text-green-600">/ {getScheduledDaysForTeacher(teacher.id).length}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-2 w-2 text-green-600" />
                  </div>
                  <span>Hadir</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-2 w-2 text-red-500" />
                  </div>
                  <span>Tidak Hadir</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-200 rounded-full"></div>
                  <span>Belum Check-in</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Tidak Jadwal</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <div className="flex flex-col lg:flex-row lg:items-center gap-1">
                  <span>Total: {filteredTeachers.length} guru</span>
                  <span>•</span>
                  <span>{scheduledDays.length} hari jadwal</span>
                  <span>•</span>
                  <span>{daysInMonth} hari bulan</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}