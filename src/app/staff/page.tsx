'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  QrCode, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Camera,
  UserCheck,
  History,
  MapPin,
  LogOut,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface CardScan {
  id: string;
  cardId: string;
  userId: string;
  scanType: 'CHECK_IN' | 'CHECK_OUT';
  scanTime: string;
  location?: string;
  deviceInfo?: string;
  isValid: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
}

export default function StaffDashboard() {
  const [scanHistory, setScanHistory] = useState<CardScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [location, setLocation] = useState('Gerbang Utama');
  const [lastScan, setLastScan] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchScanHistory();
    getCurrentUser();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logout berhasil');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: tetap logout meskipun API gagal
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logout berhasil');
      window.location.href = '/login';
    }
  };

  const fetchScanHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/staff/scan?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScanHistory(data);
      } else if (response.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
      } else {
        toast.error('Gagal memuat riwayat scan');
      }
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast.error('Gagal memuat riwayat scan');
    } finally {
      setLoading(false);
    }
  };

  const handleCardScan = async (cardId: string) => {
    if (!cardId.trim()) return;

    setScanning(true);
    console.log('=== STAFF CARD SCAN ===');
    console.log('Card ID:', cardId);
    console.log('Scan Type:', scanType);
    console.log('Location:', location);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan, silakan login kembali');
        return;
      }

      const response = await fetch('/api/staff/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: cardId.trim(),
          scanType,
          location,
          deviceInfo: 'Staff Dashboard Scanner'
        })
      });

      const result = await response.json();
      console.log('Scan response:', result);

      if (response.ok) {
        setLastScan(result);
        toast.success(`${result.user.name} - ${scanType === 'CHECK_IN' ? 'Check In' : 'Check Out'} berhasil!`);
        
        if (inputRef.current) {
          inputRef.current.value = '';
          inputRef.current.focus();
        }
        
        fetchScanHistory();
      } else {
        toast.error(result.error || 'Gagal memproses scan');
      }
    } catch (error) {
      console.error('Error scanning card:', error);
      toast.error('Terjadi kesalahan saat scan');
    } finally {
      setScanning(false);
    }
  };

  const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cardId = e.currentTarget.value;
      handleCardScan(cardId);
    }
  };

  const simulateScan = (cardId: string) => {
    if (inputRef.current) {
      inputRef.current.value = cardId;
      handleCardScan(cardId);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-gray-600">Sistem Absensi Berbasis Kartu</p>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{currentUser.name}</span>
              <Badge variant="outline">{currentUser.role}</Badge>
            </div>
          )}
          <Button onClick={fetchScanHistory} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Card Scanner
            </CardTitle>
            <CardDescription>
              Scan kartu ID untuk absensi siswa/guru
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipe Scan</label>
                <Select value={scanType} onValueChange={(value: 'CHECK_IN' | 'CHECK_OUT') => setScanType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHECK_IN">Check In</SelectItem>
                    <SelectItem value="CHECK_OUT">Check Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Lokasi</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gerbang Utama">Gerbang Utama</SelectItem>
                    <SelectItem value="Gerbang Belakang">Gerbang Belakang</SelectItem>
                    <SelectItem value="Kelas 7A">Kelas 7A</SelectItem>
                    <SelectItem value="Kelas 7B">Kelas 7B</SelectItem>
                    <SelectItem value="Kelas 8A">Kelas 8A</SelectItem>
                    <SelectItem value="Kelas 8B">Kelas 8B</SelectItem>
                    <SelectItem value="Kelas 9A">Kelas 9A</SelectItem>
                    <SelectItem value="Kelas 9B">Kelas 9B</SelectItem>
                    <SelectItem value="Lab Komputer">Lab Komputer</SelectItem>
                    <SelectItem value="Perpustakaan">Perpustakaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Card ID / QR Code</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan kartu atau masukkan Card ID"
                  className="w-full p-3 border rounded-lg pr-10"
                  onKeyDown={handleManualInput}
                  disabled={scanning}
                />
                <QrCode className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tekan Enter setelah memasukkan Card ID
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Demo Card IDs:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateScan('ADMIN001')}
                  disabled={scanning}
                >
                  Admin (ADMIN001)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateScan('GURU001')}
                  disabled={scanning}
                >
                  Guru (GURU001)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateScan('SISWA001')}
                  disabled={scanning}
                >
                  Siswa (SISWA001)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateScan('STAFF001')}
                  disabled={scanning}
                >
                  Staff (STAFF001)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Scan Terakhir
            </CardTitle>
            <CardDescription>
              Hasil scan kartu terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastScan ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {lastScan.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{lastScan.user.name}</h3>
                    <p className="text-sm text-gray-500">{lastScan.user.role}</p>
                  </div>
                  <Badge variant={lastScan.scan.scanType === 'CHECK_IN' ? 'default' : 'secondary'}>
                    {lastScan.scan.scanType === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Card ID:</span>
                    <p className="font-mono">{lastScan.scan.cardId}</p>
                  </div>
                  <div>
                    <span className="font-medium">Waktu:</span>
                    <p>{new Date(lastScan.scan.scanTime).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Lokasi:</span>
                    <p>{lastScan.scan.location}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      Berhasil
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada scan kartu</p>
                <p className="text-sm">Scan kartu untuk melihat hasil</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Scan
          </CardTitle>
          <CardDescription>
            20 scan kartu terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Card ID</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Belum ada riwayat scan
                  </TableCell>
                </TableRow>
              ) : (
                scanHistory.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      {new Date(scan.scanTime).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {scan.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{scan.user.name}</div>
                          <div className="text-xs text-gray-500">{scan.user.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{scan.cardId}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={scan.scanType === 'CHECK_IN' ? 'default' : 'secondary'}>
                        {scan.scanType === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {scan.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      {scan.isValid ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valid
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Invalid
                        </div>
                      )}
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