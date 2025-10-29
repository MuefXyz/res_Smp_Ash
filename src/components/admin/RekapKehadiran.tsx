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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rekap Kehadiran Guru</h2>
          <p className="text-gray-500">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Guru</p>
                <p className="text-lg font-bold">{monthlyData?.teachers.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Hadir</p>
                <p className="text-lg font-bold text-green-600">{stats.hadir}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Alpa</p>
                <p className="text-lg font-bold text-red-600">{stats.alpha}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Terlambat</p>
                <p className="text-lg font-bold text-yellow-600">{stats.terlambat}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Izin</p>
                <p className="text-lg font-bold text-blue-600">{stats.ijin}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Sakit</p>
                <p className="text-lg font-bold text-purple-600">{stats.sakit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir</option>
              <option value="ALPHA">Alpa</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabel Kehadiran</CardTitle>
          <CardDescription>
            Rekap kehadiran guru untuk {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">
                    Nama Guru
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-900">
                    NIP
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                    <th
                      key={day}
                      className="border border-gray-200 px-2 py-2 text-center font-medium text-gray-900 min-w-[40px]"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-900 bg-green-50">
                    Jumlah Hadir
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, index) => {
                  const attendanceCount = getTeacherAttendanceCount(teacher.id);
                  return (
                    <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {teacher.name}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        {teacher.nip}
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const attendance = getAttendanceForDate(teacher.id, day);
                        
                        return (
                          <td
                            key={day}
                            className="border border-gray-200 px-2 py-2 text-center"
                          >
                            {attendance && attendance.status === 'HADIR' ? (
                              <div className="flex justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                            ) : attendance ? (
                              <div className="flex justify-center">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </div>
                            ) : (
                              <div className="h-4"></div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-gray-200 px-4 py-2 text-center bg-green-50 font-bold text-green-700">
                        {attendanceCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}