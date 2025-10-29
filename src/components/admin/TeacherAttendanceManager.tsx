'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  email: string;
  nip?: string;
}

interface AttendanceLog {
  id: string;
  teacherId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA';
  notes?: string;
  isScheduled: boolean;
  overtimeHours?: number;
  createdAt: string;
  teacher: Teacher;
}

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

export default function TeacherAttendanceManager() {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    teacherId: ''
  });
  const [formData, setFormData] = useState({
    teacherId: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'HADIR' as const,
    notes: ''
  });

  useEffect(() => {
    fetchAttendanceLogs();
    fetchTeachers();
  }, [filters]);

  const fetchAttendanceLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.teacherId) params.append('teacherId', filters.teacherId);
      
      const response = await fetch(`/api/admin/attendance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceLogs(data);
      }
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      toast.error('Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?role=GURU', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Kehadiran berhasil dicatat');
        setIsDialogOpen(false);
        setFormData({
          teacherId: '',
          date: '',
          checkInTime: '',
          checkOutTime: '',
          status: 'HADIR',
          notes: ''
        });
        fetchAttendanceLogs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal mencatat kehadiran');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manajemen Kehadiran Guru</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Catat Kehadiran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Kehadiran Guru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="teacherId">Guru</Label>
                <Select value={formData.teacherId} onValueChange={(value) => setFormData({...formData, teacherId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.nip || teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HADIR">Hadir</SelectItem>
                    <SelectItem value="SAKIT">Sakit</SelectItem>
                    <SelectItem value="IZIN">Izin</SelectItem>
                    <SelectItem value="ALPHA">Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.status === 'HADIR' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInTime">Jam Masuk</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({...formData, checkInTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOutTime">Jam Keluar</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData({...formData, checkOutTime: e.target.value})}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Tambahkan catatan jika diperlukan"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filterStartDate">Tanggal Mulai</Label>
              <Input
                id="filterStartDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="filterEndDate">Tanggal Selesai</Label>
              <Input
                id="filterEndDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="filterTeacher">Guru</Label>
              <Select value={filters.teacherId} onValueChange={(value) => setFilters({...filters, teacherId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Guru</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ startDate: '', endDate: '', teacherId: '' })}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Kehadiran Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Keluar</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Lembur</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatDate(log.date)}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.date).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.teacher.name}</div>
                      <div className="text-sm text-gray-500">{log.teacher.nip || log.teacher.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[log.status]}>
                      {statusLabels[log.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatTime(log.checkInTime)}</TableCell>
                  <TableCell>{formatTime(log.checkOutTime)}</TableCell>
                  <TableCell>
                    <Badge variant={log.isScheduled ? 'default' : 'secondary'}>
                      {log.isScheduled ? 'Sesuai Jadwal' : 'Lu Jadwal'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.overtimeHours && log.overtimeHours > 0 ? (
                      <span className="text-green-600 font-medium">
                        {log.overtimeHours.toFixed(1)} jam
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={log.notes}>
                      {log.notes || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}