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
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Timer,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface CoachAbsence {
  id: string;
  date: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA';
  reason?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  participantCount?: number;
  coach: {
    id: string;
    name: string;
    email: string;
    nip?: string;
    role: string;
  };
  extracurricular: {
    id: string;
    name: string;
    schedule?: string;
    venue?: string;
  };
}

interface Extracurricular {
  id: string;
  name: string;
  schedule?: string;
  venue?: string;
  coach: {
    id: string;
    name: string;
  };
}

export default function CoachAbsenceManagement() {
  const [absences, setAbsences] = useState<CoachAbsence[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    extracurricularId: '',
    status: 'HADIR' as 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA',
    reason: '',
    notes: '',
    startTime: '',
    endTime: '',
    participantCount: '',
  });

  const statusColors = {
    HADIR: 'bg-green-100 text-green-800',
    SAKIT: 'bg-red-100 text-red-800',
    IZIN: 'bg-yellow-100 text-yellow-800',
    ALPHA: 'bg-gray-100 text-gray-800',
  };

  const statusIcons = {
    HADIR: <CheckCircle className="h-4 w-4" />,
    SAKIT: <UserX className="h-4 w-4" />,
    IZIN: <AlertCircle className="h-4 w-4" />,
    ALPHA: <Timer className="h-4 w-4" />,
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch absences for selected date
      const absencesResponse = await fetch(`/api/admin/coach-absence?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (absencesResponse.ok) {
        const absencesData = await absencesResponse.json();
        setAbsences(absencesData);
      }

      // Fetch extracurriculars for selection
      const extracurricularsResponse = await fetch('/api/admin/extracurriculars?isActive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (extracurricularsResponse.ok) {
        const extracurricularsData = await extracurricularsResponse.json();
        setExtracurriculars(extracurricularsData);
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

      const submitData = {
        ...formData,
        date: selectedDate,
        participantCount: formData.participantCount ? parseInt(formData.participantCount) : undefined,
      };

      const response = await fetch('/api/admin/coach-absence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success('Absensi pembina berhasil dicatat');
        setIsRecordDialogOpen(false);
        setFormData({
          extracurricularId: '',
          status: 'HADIR',
          reason: '',
          notes: '',
          startTime: '',
          endTime: '',
          participantCount: '',
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal mencatat absensi');
      }
    } catch (error) {
      console.error('Error recording absence:', error);
      toast.error('Gagal mencatat absensi');
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
          <h2 className="text-2xl font-bold">Absensi Pembina</h2>
          <p className="text-gray-600">Catat kehadiran pembina ekstrakurikuler</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          
          <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Catat Absensi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Catat Absensi Pembina</DialogTitle>
                <DialogDescription>
                  Catat kehadiran pembina untuk tanggal {selectedDate}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="extracurricularId">Ekstrakurikuler</Label>
                  <Select 
                    value={formData.extracurricularId} 
                    onValueChange={(value) => setFormData({ ...formData, extracurricularId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ekstrakurikuler" />
                    </SelectTrigger>
                    <SelectContent>
                      {extracurriculars.map((extracurricular) => (
                        <SelectItem key={extracurricular.id} value={extracurricular.id}>
                          {extracurricular.name} - {extracurricular.coach.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status Kehadiran</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HADIR">Hadir</SelectItem>
                      <SelectItem value="SAKIT">Sakit</SelectItem>
                      <SelectItem value="IZIN">Izin</SelectItem>
                      <SelectItem value="ALPHA">Alpa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status !== 'HADIR' && (
                  <div>
                    <Label htmlFor="reason">Alasan</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Jelaskan alasan ketidakhadiran"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Catatan Latihan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Materi latihan, kegiatan yang dilakukan, dll"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startTime">Waktu Mulai</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Waktu Selesai</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="participantCount">Jumlah Peserta</Label>
                    <Input
                      id="participantCount"
                      type="number"
                      value={formData.participantCount}
                      onChange={(e) => setFormData({ ...formData, participantCount: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    Simpan Absensi
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absensi Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absences.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedDate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hadir</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {absences.filter(a => a.status === 'HADIR').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pembina hadir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tidak Hadir</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {absences.filter(a => a.status !== 'HADIR').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sakit, Izin, Alpa
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
              {absences.reduce((sum, a) => sum + (a.participantCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Seluruh kegiatan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Absences List */}
      <div className="space-y-4">
        {absences.map((absence) => (
          <Card key={absence.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Coach Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {absence.coach.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {/* Coach and Extracurricular Info */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {absence.coach.name}
                      </h3>
                      <Badge className={statusColors[absence.status]}>
                        <div className="flex items-center space-x-1">
                          {statusIcons[absence.status]}
                          <span>{absence.status}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      Pembina {absence.extracurricular.name}
                    </p>
                    
                    {/* Schedule and Venue */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      {absence.extracurricular.schedule && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{absence.extracurricular.schedule}</span>
                        </div>
                      )}
                      {absence.extracurricular.venue && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{absence.extracurricular.venue}</span>
                        </div>
                      )}
                    </div>

                    {/* Time and Participants */}
                    {(absence.startTime || absence.endTime || absence.participantCount) && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {absence.startTime && (
                          <div className="flex items-center space-x-1">
                            <Timer className="h-4 w-4" />
                            <span>{absence.startTime} - {absence.endTime || 'Selesai'}</span>
                          </div>
                        )}
                        {absence.participantCount && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{absence.participantCount} peserta</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {absence.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-700">Catatan:</p>
                        <p className="text-gray-600">{absence.notes}</p>
                      </div>
                    )}

                    {/* Reason for non-attendance */}
                    {absence.reason && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                        <p className="font-medium text-red-700">Alasan:</p>
                        <p className="text-red-600">{absence.reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {absences.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data absensi</h3>
          <p className="text-gray-500 mb-4">
            Belum ada pembina yang mencatat absensi untuk tanggal {selectedDate}
          </p>
          <Button onClick={() => setIsRecordDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Catat Absensi Pertama
          </Button>
        </div>
      )}
    </div>
  );
}