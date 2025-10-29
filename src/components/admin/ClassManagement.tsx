'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck, 
  MapPin, 
  Calendar,
  BookOpen,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

interface Class {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  homeroomTeacher?: {
    id: string;
    name: string;
    email: string;
    nip?: string;
  };
  room?: string;
  capacity: number;
  students: {
    student: {
      id: string;
      name: string;
      nis?: string;
      email: string;
    };
  }[];
  _count: {
    students: number;
  };
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  nip?: string;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    academicYear: '2024/2025',
    homeroomTeacherId: '',
    room: '',
    capacity: 30,
  });

  const levels = ['VII', 'VIII', 'IX'];
  const academicYears = ['2023/2024', '2024/2025', '2025/2026'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch classes
      const classesResponse = await fetch('/api/admin/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData);
      }

      // Fetch teachers for homeroom selection
      const teachersResponse = await fetch('/api/admin/users?role=GURU', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.filter((t: Teacher) => t.isActive));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Kelas berhasil dibuat');
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          level: '',
          academicYear: '2024/2025',
          homeroomTeacherId: '',
          room: '',
          capacity: 30,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal membuat kelas');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Gagal membuat kelas');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Kelas</h2>
          <p className="text-gray-600">Kelola kelas dan wali kelas</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Kelas Baru</DialogTitle>
              <DialogDescription>
                Buat kelas baru dan tentukan wali kelasnya
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Kelas</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VII-A"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="level">Tingkat</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Tahun Ajaran</Label>
                  <Select value={formData.academicYear} onValueChange={(value) => setFormData({ ...formData, academicYear: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacity">Kapasitas</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="homeroomTeacherId">Wali Kelas</Label>
                <Select value={formData.homeroomTeacherId} onValueChange={(value) => setFormData({ ...formData, homeroomTeacherId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wali kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.nip})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="room">Ruangan</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Ruang 101"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Buat Kelas
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              Aktif tahun ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas VII</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.filter(c => c.level === 'VII').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {classes.filter(c => c.level === 'VII').reduce((sum, c) => sum + c._count.students, 0)} siswa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas VIII</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.filter(c => c.level === 'VIII').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {classes.filter(c => c.level === 'VIII').reduce((sum, c) => sum + c._count.students, 0)} siswa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas IX</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.filter(c => c.level === 'IX').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {classes.filter(c => c.level === 'IX').reduce((sum, c) => sum + c._count.students, 0)} siswa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <CardDescription>
                    {classItem.level} • {classItem.academicYear}
                  </CardDescription>
                </div>
                <Badge variant={classItem._count.students >= classItem.capacity ? "destructive" : "secondary"}>
                  {classItem._count.students}/{classItem.capacity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Homeroom Teacher */}
              {classItem.homeroomTeacher ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={classItem.homeroomTeacher.avatar} />
                    <AvatarFallback>
                      {classItem.homeroomTeacher.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {classItem.homeroomTeacher.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Wali Kelas
                    </p>
                  </div>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-gray-400">
                  <UserPlus className="h-4 w-4" />
                  <p className="text-sm">Belum ada wali kelas</p>
                </div>
              )}

              {/* Room */}
              {classItem.room && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{classItem.room}</span>
                </div>
              )}

              {/* Students Preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Siswa ({classItem._count.students})</span>
                  <Button variant="ghost" size="sm">
                    Lihat Semua
                  </Button>
                </div>
                
                {classItem.students.length > 0 && (
                  <div className="space-y-1">
                    {classItem.students.slice(0, 3).map((student) => (
                      <div key={student.student.id} className="flex items-center space-x-2 text-sm">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="truncate">{student.student.name}</span>
                        {student.student.nis && (
                          <span className="text-gray-400 text-xs">({student.student.nis})</span>
                        )}
                      </div>
                    ))}
                    {classItem.students.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{classItem.students.length - 3} siswa lainnya
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="h-4 w-4 mr-1" />
                  Siswa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kelas</h3>
          <p className="text-gray-500 mb-4">Mulai dengan membuat kelas baru</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        </div>
      )}
    </div>
  );
}