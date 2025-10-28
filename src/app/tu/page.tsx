'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Users, 
  FileText, 
  Bell, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';

interface Payment {
  id: string;
  studentId: string;
  student: {
    name: string;
    nis: string;
  };
  type: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  nis: string;
  phone?: string;
}

export default function TUDashboard() {
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    overduePayments: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    type: 'SPP',
    amount: '',
    dueDate: '',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'TU') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      // Fetch payments
      const paymentsResponse = await fetch('/api/tu/payments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
        
        // Calculate stats
        const totalPayments = paymentsData.length;
        const pendingPayments = paymentsData.filter((p: Payment) => p.status === 'PENDING').length;
        const paidPayments = paymentsData.filter((p: Payment) => p.status === 'PAID').length;
        const overduePayments = paymentsData.filter((p: Payment) => p.status === 'OVERDUE').length;
        const totalRevenue = paymentsData
          .filter((p: Payment) => p.status === 'PAID')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);
        
        // This month revenue
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthRevenue = paymentsData
          .filter((p: Payment) => 
            p.status === 'PAID' && 
            new Date(p.paidDate || '') >= thisMonth
          )
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);
        
        setStats({
          totalPayments,
          pendingPayments,
          paidPayments,
          overduePayments,
          totalRevenue,
          thisMonthRevenue,
        });
      }

      // Fetch students
      const studentsResponse = await fetch('/api/tu/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/tu/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...newPayment,
          amount: parseFloat(newPayment.amount),
        }),
      });

      if (response.ok) {
        setShowCreatePayment(false);
        setNewPayment({
          studentId: '',
          type: 'SPP',
          amount: '',
          dueDate: '',
          description: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/tu/payments/${paymentId}/paid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.student.nis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">TU Dashboard</h1>
                <p className="text-sm text-gray-500">Tata Usaha - SMP ASH SOLIHIN</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Tata Usaha</p>
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% dari bulan lalu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Pembayaran</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overduePayments} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Rp {stats.thisMonthRevenue.toLocaleString()} bulan ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidPayments}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.paidPayments / stats.totalPayments) * 100).toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Manajemen Pembayaran</TabsTrigger>
            <TabsTrigger value="students">Data Siswa</TabsTrigger>
            <TabsTrigger value="reports">Laporan</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manajemen Pembayaran</CardTitle>
                    <CardDescription>Kelola pembayaran siswa</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreatePayment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pembayaran
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Cari nama atau NIS siswa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value="PENDING">Menunggu</SelectItem>
                      <SelectItem value="PAID">Dibayar</SelectItem>
                      <SelectItem value="OVERDUE">Terlambat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Siswa</th>
                        <th className="text-left p-2">Jenis</th>
                        <th className="text-left p-2">Jumlah</th>
                        <th className="text-left p-2">Jatuh Tempo</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{payment.student.name}</p>
                              <p className="text-sm text-gray-500">{payment.student.nis}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">{payment.type}</Badge>
                          </td>
                          <td className="p-2">Rp {payment.amount.toLocaleString()}</td>
                          <td className="p-2">
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <Badge 
                              variant={
                                payment.status === 'PAID' ? 'default' :
                                payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              {payment.status === 'PENDING' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkPaid(payment.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Create Payment Modal */}
            {showCreatePayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Pembayaran Baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div>
                      <Label htmlFor="student">Siswa</Label>
                      <Select value={newPayment.studentId} onValueChange={(value) => setNewPayment({ ...newPayment, studentId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih siswa" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.nis})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Jenis Pembayaran</Label>
                        <Select value={newPayment.type} onValueChange={(value) => setNewPayment({ ...newPayment, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SPP">SPP</SelectItem>
                            <SelectItem value="UANG_BANGUNAN">Uang Bangunan</SelectItem>
                            <SelectItem value="UANG_KEGIATAN">Uang Kegiatan</SelectItem>
                            <SelectItem value="UANG_BUKU">Uang Buku</SelectItem>
                            <SelectItem value="LAINNYA">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="amount">Jumlah</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                          placeholder="Masukkan jumlah"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="dueDate">Jatuh Tempo</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newPayment.dueDate}
                        onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input
                        id="description"
                        value={newPayment.description}
                        onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                        placeholder="Masukkan deskripsi (opsional)"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit">Simpan</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreatePayment(false)}>
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Siswa</CardTitle>
                <CardDescription>Daftar seluruh siswa aktif</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nama</th>
                        <th className="text-left p-2">NIS</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Telepon</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b">
                          <td className="p-2">{student.name}</td>
                          <td className="p-2">{student.nis}</td>
                          <td className="p-2">{student.email}</td>
                          <td className="p-2">{student.phone || '-'}</td>
                          <td className="p-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Laporan Keuangan</CardTitle>
                    <CardDescription>Ringkasan laporan pembayaran</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Ringkasan Bulan Ini</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Pembayaran:</span>
                        <span className="font-medium">Rp {stats.thisMonthRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jumlah Transaksi:</span>
                        <span className="font-medium">{stats.paidPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rata-rata:</span>
                        <span className="font-medium">
                          Rp {stats.paidPayments > 0 ? (stats.thisMonthRevenue / stats.paidPayments).toLocaleString() : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Status Pembayaran</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Menunggu:</span>
                        <span className="font-medium text-yellow-600">{stats.pendingPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dibayar:</span>
                        <span className="font-medium text-green-600">{stats.paidPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terlambat:</span>
                        <span className="font-medium text-red-600">{stats.overduePayments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}