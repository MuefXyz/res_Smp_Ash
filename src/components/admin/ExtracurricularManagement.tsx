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
  Trophy,
  Clock,
  UserPlus,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface Extracurricular {
  id: string;
  name: string;
  description?: string;
  schedule?: string;
  venue?: string;
  maxMembers: number;
  isActive: boolean;
  coach: {
    id: string;
    name: string;
    email: string;
    nip?: string;
  };
  members: {
    student: {
      id: string;
      name: string;
      nis?: string;
      email: string;
    };
    role: string;
  }[];
  _count: {
    members: number;
  };
}

interface Coach {
  id: string;
  name: string;
  email: string;
  nip?: string;
  role: string;
}

export default function ExtracurricularManagement() {
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coachId: '',
    schedule: '',
    venue: '',
    maxMembers: 30,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch extracurriculars
      const extracurricularsResponse = await fetch('/api/admin/extracurriculars', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (extracurricularsResponse.ok) {
        const extracurricularsData = await extracurricularsResponse.json();
        setExtracurriculars(extracurricularsData);
      }

      // Fetch coaches (teachers and staff)
      const coachesResponse = await fetch('/api/admin/coach-attendance/coaches', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (coachesResponse.ok) {
        const coachesData = await coachesResponse.json();
        setCoaches(coachesData);
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

      const response = await fetch('/api/admin/extracurriculars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Ekstrakurikuler berhasil dibuat');
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          coachId: '',
          schedule: '',
          venue: '',
          maxMembers: 30,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal membuat ekstrakurikuler');
      }
    } catch (error) {
      console.error('Error creating extracurricular:', error);
      toast.error('Gagal membuat ekstrakurikuler');
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
          <h2 className="text-2xl font-bold">Manajemen Ekstrakurikuler</h2>
          <p className="text-gray-600">Kelola kegiatan ekstrakurikuler dan pembina</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Ekstrakurikuler
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Ekstrakurikuler Baru</DialogTitle>
              <DialogDescription>
                Buat kegiatan ekstrakurikuler baru dan tentukan pembina
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Ekstrakurikuler</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Pramuka, Basket, dll"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi kegiatan ekstrakurikuler"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="coachId">Pembina</Label>
                <Select value={formData.coachId} onValueChange={(value) => setFormData({ ...formData, coachId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pembina" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.name} ({coach.nip})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule">Jadwal</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="Senin & Rabu, 15:00-17:00"
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Tempat</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Lapangan, Ruang Musik, dll"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxMembers">Kapasitas Maksimal</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Buat Ekstrakurikuler
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
            <CardTitle className="text-sm font-medium">Total Ekstrakurikuler</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extracurriculars.length}</div>
            <p className="text-xs text-muted-foreground">
              {extracurriculars.filter(e => e.isActive).length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extracurriculars.reduce((sum, e) => sum + e._count.members, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Seluruh ekstrakurikuler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembina</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(extracurriculars.map(e => e.coach.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Guru dan staff aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kapasitas Terpakai</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extracurriculars.length > 0 
                ? Math.round((extracurriculars.reduce((sum, e) => sum + e._count.members, 0) / 
                    extracurriculars.reduce((sum, e) => sum + e.maxMembers, 0)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Rata-rata pengisian
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extracurriculars List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extracurriculars.map((extracurricular) => (
          <Card key={extracurricular.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{extracurricular.name}</CardTitle>
                  {extracurricular.description && (
                    <CardDescription className="mt-1">
                      {extracurricular.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={extracurricular.isActive ? "default" : "secondary"}>
                  {extracurricular.isActive ? 'Aktif' : 'Non-aktif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coach */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={extracurricular.coach.avatar} />
                  <AvatarFallback>
                    {extracurricular.coach.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {extracurricular.coach.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Pembina
                  </p>
                </div>
                <UserCheck className="h-4 w-4 text-green-500" />
              </div>

              {/* Schedule and Venue */}
              {extracurricular.schedule && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{extracurricular.schedule}</span>
                </div>
              )}

              {extracurricular.venue && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{extracurricular.venue}</span>
                </div>
              )}

              {/* Members */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Peserta ({extracurricular._count.members})</span>
                  <Badge variant={extracurricular._count.members >= extracurricular.maxMembers ? "destructive" : "secondary"}>
                    {extracurricular._count.members}/{extracurricular.maxMembers}
                  </Badge>
                </div>
                
                {extracurricular.members.length > 0 && (
                  <div className="space-y-1">
                    {extracurricular.members.slice(0, 3).map((member) => (
                      <div key={member.student.id} className="flex items-center space-x-2 text-sm">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="truncate">{member.student.name}</span>
                        {member.role !== 'Anggota' && (
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {extracurricular.members.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{extracurricular.members.length - 3} peserta lainnya
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
                  Peserta
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {extracurriculars.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada ekstrakurikuler</h3>
          <p className="text-gray-500 mb-4">Mulai dengan membuat kegiatan ekstrakurikuler baru</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Ekstrakurikuler
          </Button>
        </div>
      )}
    </div>
  );
}