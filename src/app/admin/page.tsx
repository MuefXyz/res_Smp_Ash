'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TeacherScheduleManager from '@/components/admin/TeacherScheduleManager';
import UserManagement from '@/components/admin/UserManagement';
import CardManagement from '@/components/admin/CardManagement';
import CardScanSystem from '@/components/admin/CardScanSystem';
import Sidebar from '@/components/admin/Sidebar';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  DollarSign, 
  Bell, 
  Settings,
  LogOut,
  Eye,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Calendar,
  Download,
  Upload,
  CreditCard,
  Scan
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  nis?: string;
  nip?: string;
  isActive: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const menuItems = [
  {
    id: 'users',
    label: 'Manajemen User',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    id: 'cards',
    label: 'Card ID',
    icon: CreditCard,
    color: 'text-green-600'
  },
  {
    id: 'scan',
    label: 'Card Scan',
    icon: Scan,
    color: 'text-purple-600'
  },
  {
    id: 'schedule',
    label: 'Jadwal Guru',
    icon: Calendar,
    color: 'text-orange-600'
  },
  {
    id: 'notifications',
    label: 'Notifikasi',
    icon: Bell,
    color: 'text-red-600'
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: Settings,
    color: 'text-gray-600'
  }
];

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSiswa: 0,
    totalGuru: 0,
    totalTU: 0,
    totalStaff: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Update main content margin based on sidebar state
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (sidebarCollapsed) {
        mainContent.classList.remove('ml-64');
        mainContent.classList.add('ml-20');
      } else {
        mainContent.classList.remove('ml-20');
        mainContent.classList.add('ml-64');
      }
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      // Get token from localStorage or cookie
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Calculate stats
        const totalUsers = usersData.length;
        const totalSiswa = usersData.filter((u: User) => u.role === 'SISWA').length;
        const totalGuru = usersData.filter((u: User) => u.role === 'GURU').length;
        const totalTU = usersData.filter((u: User) => u.role === 'TU').length;
        const totalStaff = usersData.filter((u: User) => u.role === 'STAFF').length;
        
        setStats(prev => ({
          ...prev,
          totalUsers,
          totalSiswa,
          totalGuru,
          totalTU,
          totalStaff,
        }));
      } else if (usersResponse.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
        return;
      }

      // Fetch notifications
      const notifResponse = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        setNotifications(notifData);
        
        const totalNotifications = notifData.length;
        const unreadNotifications = notifData.filter((n: Notification) => !n.isRead).length;
        
        setStats(prev => ({
          ...prev,
          totalNotifications,
          unreadNotifications,
        }));
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

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchData();
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchData();
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        stats={stats}
        onLogout={handleLogout}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300" id="main-content">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Admin Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">SMP ASH SOLIHIN</p>
              </div>
              
              <div className="flex items-center space-x-4">
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
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +2 dari bulan lalu
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSiswa}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +5 dari bulan lalu
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGuru}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +1 dari bulan lalu
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStaff}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +1 dari bulan lalu
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
                    {stats.totalNotifications} total notifikasi
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'cards' && <CardManagement />}
              {activeTab === 'scan' && <CardScanSystem />}
              {activeTab === 'schedule' && <TeacherScheduleManager />}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notifikasi System</CardTitle>
                    <CardDescription>Monitor semua notifikasi sistem</CardDescription>
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
                                  notification.type === 'REGISTRATION' ? 'default' :
                                  notification.type === 'ABSENCE' ? 'secondary' :
                                  notification.type === 'PAYMENT' ? 'destructive' : 'outline'
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
              )}
              {activeTab === 'settings' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan Sistem</CardTitle>
                    <CardDescription>Konfigurasi sistem dan preferensi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Notifikasi Registrasi</h4>
                          <p className="text-sm text-gray-600">Terima notifikasi saat user baru mendaftar</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Notifikasi Absensi</h4>
                          <p className="text-sm text-gray-600">Terima notifikasi saat ada absensi</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}