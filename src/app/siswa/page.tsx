'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Calendar, 
  Bell, 
  LogOut,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  User,
  Award,
  FileText,
  TrendingUp,
  GraduationCap
} from 'lucide-react';

interface LearningPost {
  id: string;
  title: string;
  content: string;
  subject?: {
    name: string;
  };
  teacher: {
    name: string;
  };
  createdAt: string;
}

interface Payment {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  description?: string;
}

interface Grade {
  id: string;
  subject: {
    name: string;
  };
  value: number;
  semester: string;
  academicYear: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function SiswaDashboard() {
  const [user, setUser] = useState<any>(null);
  const [learningPosts, setLearningPosts] = useState<LearningPost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    unreadNotifications: 0,
    pendingPayments: 0,
    averageGrade: 0,
  });
  const [loading, setLoading] = useState(true);
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
    if (parsedUser.role !== 'SISWA') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      // Fetch learning posts
      const postsResponse = await fetch('/api/siswa/posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setLearningPosts(postsData);
      }

      // Fetch payments
      const paymentsResponse = await fetch('/api/siswa/payments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      }

      // Fetch grades
      const gradesResponse = await fetch('/api/siswa/grades', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (gradesResponse.ok) {
        const gradesData = await gradesResponse.json();
        setGrades(gradesData);
      }

      // Fetch notifications
      const notifResponse = await fetch('/api/siswa/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        setNotifications(notifData);
      }

      // Calculate stats
      const unreadNotifications = notifications.filter((n: Notification) => !n.isRead).length;
      const pendingPayments = payments.filter((p: Payment) => p.status === 'PENDING' || p.status === 'OVERDUE').length;
      const averageGrade = grades.length > 0 
        ? grades.reduce((sum: number, g: Grade) => sum + g.value, 0) / grades.length 
        : 0;

      setStats({
        totalPosts: learningPosts.length,
        unreadNotifications,
        pendingPayments,
        averageGrade,
      });
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

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/siswa/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAbsence = async () => {
    try {
      const response = await fetch('/api/siswa/absence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error recording absence:', error);
    }
  };

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
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Siswa Dashboard</h1>
                <p className="text-sm text-gray-500">SMP ASH SOLIHIN</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={handleAbsence} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Absen Hari Ini
              </Button>
              
              <div className="relative">
                <Button variant="outline" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {stats.unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {stats.unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">NIS: {user?.nis}</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Selamat datang, {user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Semoga hari Anda menyenangkan dan penuh dengan pembelajaran yang bermanfaat.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Informasi Baru</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Postingan pembelajaran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifikasi</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
              <p className="text-xs text-muted-foreground">
                Belum dibaca
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pembayaran</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">
                Menunggu pembayaran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Rata-rata</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Performa akademik
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="learning" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="learning">Informasi Pembelajaran</TabsTrigger>
            <TabsTrigger value="payments">Pembayaran</TabsTrigger>
            <TabsTrigger value="grades">Nilai</TabsTrigger>
            <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pembelajaran Terbaru</CardTitle>
                <CardDescription>Tugas dan pengumuman dari guru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningPosts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{post.title}</h4>
                          {post.subject && (
                            <Badge variant="outline" className="mt-1">
                              {post.subject.name}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {post.teacher.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Pembayaran</CardTitle>
                <CardDescription>Riwayat pembayaran SPP dan lainnya</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{payment.type}</h4>
                          {payment.description && (
                            <p className="text-sm text-gray-600">{payment.description}</p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            payment.status === 'PAID' ? 'default' :
                            payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Rp {payment.amount.toLocaleString()}</span>
                        <span className="text-gray-500">
                          Jatuh tempo: {new Date(payment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {payment.paidDate && (
                        <p className="text-xs text-green-600 mt-1">
                          Dibayar: {new Date(payment.paidDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nilai Akademik</CardTitle>
                <CardDescription>Riwayat nilai mata pelajaran</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grades.map((grade) => (
                    <div key={grade.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{grade.subject.name}</h4>
                          <p className="text-sm text-gray-600">
                            Semester {grade.semester} - {grade.academicYear}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {grade.value}
                          </div>
                          <Badge 
                            variant={
                              grade.value >= 80 ? 'default' :
                              grade.value >= 70 ? 'secondary' : 'destructive'
                            }
                          >
                            {grade.value >= 80 ? 'A' :
                             grade.value >= 70 ? 'B' :
                             grade.value >= 60 ? 'C' : 'D'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifikasi</CardTitle>
                <CardDescription>Pengumuman dan informasi penting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={
                              notification.type === 'LEARNING' ? 'default' :
                              notification.type === 'PAYMENT' ? 'destructive' : 'secondary'
                            }>
                              {notification.type}
                            </Badge>
                            {!notification.isRead && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkNotificationRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}