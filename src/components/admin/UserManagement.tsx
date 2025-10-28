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
  Trash2, 
  Edit, 
  Eye,
  CheckCircle,
  Download,
  Upload,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  nis?: string;
  nip?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    nis: '',
    nip: '',
    phone: '',
    address: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success(editingUser ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
        setIsDialogOpen(false);
        setEditingUser(null);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: '',
          nis: '',
          nip: '',
          phone: '',
          address: ''
        });
        fetchUsers();
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menyimpan user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      nis: user.nis || '',
      nip: user.nip || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('User berhasil dihapus');
        fetchUsers();
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        toast.error('Gagal menghapus user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    console.log('=== TOGGLE STATUS CLICK ===');
    console.log('User ID:', userId);
    console.log('Current Status:', currentStatus);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      console.log('Token found, making GET request...');
      
      // Use GET method for toggle status
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('GET Response status:', response.status);
      console.log('GET Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Response data:', result);
        toast.success(`User berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchUsers();
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(errorData.error || 'Gagal mengubah status user');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  // Download Excel template
  const downloadTemplate = () => {
    try {
      const templateData = [
        {
          'Nama': 'John Doe',
          'Email': 'john@example.com',
          'Role': 'SISWA',
          'NIS': '001',
          'NIP': '',
          'Telepon': '08123456789',
          'Alamat': 'Jakarta'
        },
        {
          'Nama': 'Jane Smith',
          'Email': 'jane@example.com',
          'Role': 'GURU',
          'NIS': '',
          'NIP': '002',
          'Telepon': '08123456788',
          'Alamat': 'Bandung'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      const fileName = `Template_Import_User.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Template berhasil diunduh');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Gagal mengunduh template');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = users.map(user => ({
        'Nama': user.name,
        'Email': user.email,
        'Role': user.role,
        'NIS': user.nis || '',
        'NIP': user.nip || '',
        'Telepon': user.phone || '',
        'Alamat': user.address || '',
        'Status': user.isActive ? 'Aktif' : 'Non-aktif',
        'Tanggal Dibuat': new Date(user.createdAt).toLocaleDateString('id-ID')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Users');
      
      const fileName = `Data_Users_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Data user berhasil diexport ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Gagal export data ke Excel');
    }
  };

  // Import from Excel
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('=== FILE UPLOAD START ===');
    console.log('File:', file.name, file.type, file.size);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        console.log('File data loaded, type:', typeof data);
        
        const workbook = XLSX.read(data, { type: 'binary' });
        console.log('Workbook:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Parsed JSON data:', jsonData);

        // Process imported data
        const importedUsers = jsonData.map((row: any) => {
          const user = {
            name: String(row['Nama'] || '').trim(),
            email: String(row['Email'] || '').trim().toLowerCase(),
            password: 'password123', // Default password for imported users
            role: String(row['Role'] || 'SISWA').trim().toUpperCase(),
            nis: String(row['NIS'] || '').trim(), // Convert to string
            nip: String(row['NIP'] || '').trim(), // Convert to string
            phone: String(row['Telepon'] || '').trim(), // Convert to string
            address: String(row['Alamat'] || '').trim()
          };
          console.log('Processed user:', user);
          return user;
        }).filter(user => user.name && user.email && user.email.includes('@')); // Filter valid rows

        console.log('Final imported users:', importedUsers);

        if (importedUsers.length === 0) {
          toast.error('Tidak ada data valid yang dapat diimport');
          return;
        }

        // Send to API
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Token tidak ditemukan, silakan login kembali');
          return;
        }

        console.log('Sending to API...');
        const response = await fetch('/api/admin/users/bulk-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ users: importedUsers })
        });

        console.log('API Response status:', response.status);
        const result = await response.json();
        console.log('API Response result:', result);

        if (response.ok) {
          let message = `Berhasil import ${result.imported} user`;
          if (result.failed > 0) {
            message += `. Gagal: ${result.failed}`;
            if (result.errors && result.errors.length > 0) {
              console.error('Import errors:', result.errors);
              // Show first few errors in toast
              const errorSummary = result.errors.slice(0, 3).join('; ');
              toast.error(`${message}. Error: ${errorSummary}`);
              return;
            }
          }
          toast.success(message);
          fetchUsers();
        } else {
          console.error('API Error:', result);
          toast.error(result.error || 'Gagal import data');
        }
      } catch (error) {
        console.error('Error importing from Excel:', error);
        toast.error('Gagal membaca file Excel');
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast.error('Gagal membaca file');
    };

    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('=== FILE UPLOAD END ===');
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen User</h2>
          <p className="text-gray-600">Kelola semua pengguna sistem</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Tambah User Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Edit informasi user yang ada' : 'Tambah user baru ke sistem'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                      required={!editingUser}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="GURU">Guru</SelectItem>
                        <SelectItem value="TU">Tata Usaha</SelectItem>
                        <SelectItem value="SISWA">Siswa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nis">NIS (untuk Siswa)</Label>
                    <Input
                      id="nis"
                      value={formData.nis}
                      onChange={(e) => setFormData({...formData, nis: e.target.value})}
                      placeholder="Nomor Induk Siswa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nip">NIP (untuk Guru/TU)</Label>
                    <Input
                      id="nip"
                      value={formData.nip}
                      onChange={(e) => setFormData({...formData, nip: e.target.value})}
                      placeholder="Nomor Induk Pegawai"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Nomor telepon"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Alamat lengkap"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Belum ada data user
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role === 'ADMIN' ? 'destructive' :
                        user.role === 'GURU' ? 'default' :
                        user.role === 'TU' ? 'secondary' : 'outline'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {user.nis || user.nip || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {user.phone || '-'}
                      </span>
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
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          title={user.isActive ? 'Non-aktifkan user' : 'Aktifkan user'}
                          className="relative"
                        >
                          {user.isActive ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}