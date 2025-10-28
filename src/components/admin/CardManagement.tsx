'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Download, 
  QrCode,
  CreditCard,
  RefreshCw,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  nis?: string;
  nip?: string;
  phone?: string;
  address?: string;
  cardId?: string;
  isActive: boolean;
  createdAt: string;
}

export default function CardManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [formData, setFormData] = useState({
    cardId: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched users:', data); // Debug log
        console.log('User Bambang Sutrisno status:', data.find((u: User) => u.name === 'Bambang Sutrisno'));
        setUsers(data);
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        toast.error('Gagal memuat data user');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const generateCardId = (user: User) => {
    const prefix = user.role.toUpperCase().slice(0, 4);
    const number = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}${number}`;
  };

  const handleAssignCard = async (user: User) => {
    setSelectedUser(user);
    setFormData({ cardId: user.cardId || generateCardId(user) });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setIsAssigning(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      console.log('Assigning card:', formData.cardId, 'to user:', selectedUser.name); // Debug log

      const response = await fetch(`/api/admin/users/${selectedUser.id}/card?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardId: formData.cardId })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Card assignment result:', result); // Debug log
        toast.success(`Card ID "${formData.cardId}" berhasil ditetapkan untuk ${selectedUser.name}`);
        setIsDialogOpen(false);
        setSelectedUser(null);
        setFormData({ cardId: '' });
        
        // Add a small delay to ensure database is updated
        setTimeout(async () => {
          console.log('Refreshing users after card assignment...');
          await fetchUsers();
          console.log('Users refreshed successfully');
        }, 500);
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menetapkan Card ID');
      }
    } catch (error) {
      console.error('Error assigning card:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsAssigning(false);
    }
  };

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const downloadCard = async (user: User) => {
    if (!user.cardId) {
      toast.error('User belum memiliki Card ID');
      return;
    }

    try {
      toast.loading('Membuat kartu...');
      
      // Generate QR Code
      const qrCodeDataUrl = await generateQRCode(user.cardId);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Credit card size
      });

      // Card background
      pdf.setFillColor(34, 197, 94); // Green background
      pdf.rect(0, 0, 85.6, 53.98, 'F');

      // White content area
      pdf.setFillColor(255, 255, 255);
      pdf.rect(5, 5, 75.6, 43.98, 'F');

      // School Name
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SMP ASH', 10, 12);

      // User Name
      pdf.setFontSize(10);
      pdf.text(user.name, 10, 18);

      // Role
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(user.role, 10, 23);

      // ID/NIS/NIP
      pdf.setFontSize(7);
      const idText = user.nis || user.nip || user.email;
      pdf.text(idText, 10, 27);

      // Card ID
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`ID: ${user.cardId}`, 10, 32);

      // Add QR Code
      if (qrCodeDataUrl) {
        pdf.addImage(qrCodeDataUrl, 'PNG', 55, 15, 25, 25);
      }

      // Valid date
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Valid: Th. Ajar 2024/2025', 10, 40);

      // Download PDF
      pdf.save(`Kartu_${user.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Kartu berhasil diunduh');
      
    } catch (error) {
      console.error('Error generating card:', error);
      toast.error('Gagal membuat kartu');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Card ID</h2>
          <p className="text-gray-600">Kelola kartu identitas dengan QR Code untuk absensi</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Daftar Card ID
          </CardTitle>
          <CardDescription>
            Kelola dan unduh kartu identitas untuk semua pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID/NIS/NIP</TableHead>
                <TableHead>Card ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Belum ada data user
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || ''} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role === 'ADMIN' ? 'destructive' :
                        user.role === 'GURU' ? 'default' :
                        user.role === 'STAFF' ? 'secondary' :
                        'outline'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.nis || user.nip || '-'}
                    </TableCell>
                    <TableCell>
                      {user.cardId ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <QrCode className="h-4 w-4 text-green-600" />
                            <span className="font-mono text-sm font-medium">{user.cardId}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Aktif
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">Belum ada</span>
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                            Perlu Setup
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Aktif' : 'Non-aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignCard(user)}
                          className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title={user.cardId ? "Edit Card ID" : "Generate Card ID"}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        {user.cardId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCard(user)}
                            className="hover:bg-green-50 hover:border-green-300 transition-colors"
                            title="Download Card PDF"
                          >
                            <Download className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Tetapkan Card ID untuk {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Berikan Card ID unik untuk kartu identitas pengguna
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cardId">Card ID</Label>
              <Input
                id="cardId"
                value={formData.cardId}
                onChange={(e) => setFormData({...formData, cardId: e.target.value})}
                placeholder="Masukkan Card ID"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Card ID akan digunakan untuk QR Code absensi
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isAssigning}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}