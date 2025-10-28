'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  email: string;
  nip?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  subjectId?: string;
  room?: string;
  isActive: boolean;
  teacher: Teacher;
  subject?: Subject;
}

const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const workingDays = [1, 2, 3, 4, 5]; // Senin-Jumat

export default function TeacherScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, Record<number, string>>>({});
  const [selectedRooms, setSelectedRooms] = useState<Record<string, Record<number, string>>>({});

  useEffect(() => {
    fetchSchedules();
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/admin/schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        toast.error('Gagal memuat jadwal');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

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

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleDayCheck = async (teacherId: string, dayOfWeek: number, checked: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const existingSchedule = schedules.find(s => s.teacherId === teacherId && s.dayOfWeek === dayOfWeek);
      
      if (checked) {
        // Add new schedule
        const subjectId = selectedSubjects[teacherId]?.[dayOfWeek] || 'none';
        const room = selectedRooms[teacherId]?.[dayOfWeek] || '';
        
        const response = await fetch('/api/admin/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            teacherId,
            dayOfWeek: dayOfWeek.toString(),
            subjectId,
            room
          })
        });
        
        if (response.ok) {
          toast.success('Jadwal berhasil ditambahkan');
          fetchSchedules();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Gagal menambah jadwal');
        }
      } else {
        // Remove schedule
        if (existingSchedule) {
          const response = await fetch(`/api/admin/schedule/${existingSchedule.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            toast.success('Jadwal berhasil dihapus');
            fetchSchedules();
          } else {
            toast.error('Gagal menghapus jadwal');
          }
        }
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleSubjectChange = async (teacherId: string, dayOfWeek: number, subjectId: string) => {
    // Update local state
    setSelectedSubjects(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [dayOfWeek]: subjectId
      }
    }));

    // Update existing schedule
    const existingSchedule = schedules.find(s => s.teacherId === teacherId && s.dayOfWeek === dayOfWeek);
    if (existingSchedule) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`/api/admin/schedule/${existingSchedule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            teacherId,
            dayOfWeek: dayOfWeek.toString(),
            subjectId,
            room: selectedRooms[teacherId]?.[dayOfWeek] || ''
          })
        });
        
        if (response.ok) {
          toast.success('Mata pelajaran berhasil diperbarui');
          fetchSchedules();
        } else {
          toast.error('Gagal memperbarui mata pelajaran');
        }
      } catch (error) {
        console.error('Error updating subject:', error);
        toast.error('Terjadi kesalahan');
      }
    }
  };

  const handleRoomChange = async (teacherId: string, dayOfWeek: number, room: string) => {
    // Update local state
    setSelectedRooms(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [dayOfWeek]: room
      }
    }));

    // Update existing schedule
    const existingSchedule = schedules.find(s => s.teacherId === teacherId && s.dayOfWeek === dayOfWeek);
    if (existingSchedule) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`/api/admin/schedule/${existingSchedule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            teacherId,
            dayOfWeek: dayOfWeek.toString(),
            subjectId: selectedSubjects[teacherId]?.[dayOfWeek] || 'none',
            room
          })
        });
        
        if (response.ok) {
          toast.success('Ruangan berhasil diperbarui');
          fetchSchedules();
        } else {
          toast.error('Gagal memperbarui ruangan');
        }
      } catch (error) {
        console.error('Error updating room:', error);
        toast.error('Terjadi kesalahan');
      }
    }
  };

  // Group schedules by teacher for easy lookup
  const schedulesByTeacher = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.teacherId]) {
      acc[schedule.teacherId] = {};
    }
    acc[schedule.teacherId][schedule.dayOfWeek] = schedule;
    return acc;
  }, {} as Record<string, Record<number, Schedule>>);

  // Initialize selected subjects and rooms from existing schedules
  useEffect(() => {
    const initialSubjects: Record<string, Record<number, string>> = {};
    const initialRooms: Record<string, Record<number, string>> = {};
    
    schedules.forEach(schedule => {
      if (!initialSubjects[schedule.teacherId]) {
        initialSubjects[schedule.teacherId] = {};
        initialRooms[schedule.teacherId] = {};
      }
      initialSubjects[schedule.teacherId][schedule.dayOfWeek] = schedule.subjectId || 'none';
      initialRooms[schedule.teacherId][schedule.dayOfWeek] = schedule.room || '';
    });
    
    setSelectedSubjects(initialSubjects);
    setSelectedRooms(initialRooms);
  }, [schedules]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Jadwal Guru</h2>
          <p className="text-gray-600">Centang hari kerja untuk setiap guru</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Checklist Jadwal Guru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">NO</TableHead>
                  <TableHead className="min-w-48">NAMA GURU</TableHead>
                  <TableHead className="w-24 text-center">SENIN</TableHead>
                  <TableHead className="w-24 text-center">SELASA</TableHead>
                  <TableHead className="w-24 text-center">RABU</TableHead>
                  <TableHead className="w-24 text-center">KAMIS</TableHead>
                  <TableHead className="w-24 text-center">JUMAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Belum ada data guru
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((teacher, teacherIndex) => {
                    const teacherSchedules = schedulesByTeacher[teacher.id] || {};
                    
                    return (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacherIndex + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-gray-500">{teacher.nip || teacher.email}</div>
                          </div>
                        </TableCell>
                        
                        {workingDays.map((dayNum) => {
                          const schedule = teacherSchedules[dayNum];
                          const isChecked = !!schedule;
                          
                          return (
                            <TableCell key={dayNum} className="text-center">
                              <div className="space-y-2">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => 
                                      handleDayCheck(teacher.id, dayNum, checked as boolean)
                                    }
                                  />
                                </div>
                                
                                {isChecked && (
                                  <div className="space-y-1">
                                    <Select
                                      value={selectedSubjects[teacher.id]?.[dayNum] || 'none'}
                                      onValueChange={(value) => 
                                        handleSubjectChange(teacher.id, dayNum, value)
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">-</SelectItem>
                                        {subjects.map((subject) => (
                                          <SelectItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    
                                    <input
                                      type="text"
                                      placeholder="Ruangan"
                                      value={selectedRooms[teacher.id]?.[dayNum] || ''}
                                      onChange={(e) => 
                                        handleRoomChange(teacher.id, dayNum, e.target.value)
                                      }
                                      className="w-full h-8 text-xs px-2 border rounded"
                                    />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}