'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Scan, 
  Users, 
  Clock, 
  TrendingUp,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface CardScan {
  id: string;
  cardId: string;
  userId: string;
  scanType: 'CHECK_IN' | 'CHECK_OUT';
  scanTime: string;
  location?: string;
  deviceInfo?: string;
  notes?: string;
  isValid: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    nis?: string;
    nip?: string;
  };
}

interface Statistics {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalScans: number;
    checkInCount: number;
    checkOutCount: number;
    uniqueUsers: number;
  };
  recentScans: CardScan[];
  topScanners: Array<{
    userId: string;
    userName: string;
    userRole: string;
    scanCount: number;
    nis?: string;
    nip?: string;
  }>;
}

interface CardScanNotification {
  cardId: string;
  userId: string;
  userName: string;
  userRole: string;
  scanType: string;
  location?: string;
  scanTime: string;
  timestamp: string;
  message: string;
}

export default function CardScanSystem() {
  const [scans, setScans] = useState<CardScan[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<CardScanNotification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'disabled'>('connecting');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [formData, setFormData] = useState({
    cardId: '',
    scanType: 'CHECK_IN' as 'CHECK_IN' | 'CHECK_OUT',
    location: '',
    notes: ''
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    scanType: 'ALL',
    dateFrom: '',
    dateTo: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const cardIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStatistics();
    fetchScans();
    initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [pagination.page, filters]);

  const initializeSocket = () => {
    try {
      // Disable Socket.IO after 3 failed attempts
      if (connectionAttempts >= 3) {
        console.log('🚫 Socket.IO disabled after multiple failed attempts');
        setConnectionStatus('disabled');
        return;
      }

      setConnectionStatus('connecting');
      setConnectionAttempts(prev => prev + 1);
      
      // Use the same hostname as the current page to avoid connection issues
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:3000`;
      
      console.log(`🚀 Attempt ${connectionAttempts + 1}: Connecting to Socket.IO at:`, socketUrl);
      
      // Simple, reliable configuration
      const newSocket = io(socketUrl, {
        path: '/api/socketio',
        transports: ['polling'], // Start with polling only
        timeout: 10000, // 10 second timeout
        reconnection: false, // Handle manually
        forceNew: true
      });
      
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('✅ Connected to socket server with ID:', newSocket.id);
        console.log('📡 Transport used:', newSocket.io.engine.transport.name);
        setConnectionStatus('connected');
        setConnectionAttempts(0); // Reset attempts on successful connection
        newSocket.emit('join-admin');
      });
      
      newSocket.on('card-scan-notification', (notification: CardScanNotification) => {
        console.log('📨 Received card scan notification:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Show toast notification
        toast.success(notification.message, {
          icon: notification.scanType === 'CHECK_IN' ? '🟢' : '🔴',
          duration: 3000
        });
        
        // Refresh data
        fetchScans();
        fetchStatistics();
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from socket server:', reason);
        setConnectionStatus('disconnected');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type,
          transport: newSocket.io.engine?.transport?.name
        });
        
        setConnectionStatus('disconnected');
        
        // Clean up the failed socket
        newSocket.disconnect();
        setSocket(null);
        
        // Retry after delay
        if (error.message.includes('timeout') && connectionAttempts < 3) {
          console.log('⏰ Timeout detected, retrying...');
          setTimeout(() => {
            initializeSocket();
          }, 3000);
        }
      });
      
    } catch (error) {
      console.error('💥 Error initializing socket:', error);
      setConnectionStatus('disconnected');
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/card-scan/statistics?period=today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchScans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Convert filters to API parameters, changing "ALL" to empty string for scanType
      const apiFilters = { ...filters };
      if (apiFilters.scanType === 'ALL') {
        apiFilters.scanType = '';
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(apiFilters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/card-scan?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScans(data.data);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast.error('Gagal memuat data scan');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setScanLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      const response = await fetch('/api/admin/card-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message);
        setIsScanDialogOpen(false);
        setFormData({ cardId: '', scanType: 'CHECK_IN', location: '', notes: '' });
        
        // Refresh data
        fetchScans();
        fetchStatistics();
      } else {
        toast.error(result.error || 'Gagal melakukan scan');
      }
    } catch (error) {
      console.error('Error scanning card:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setScanLoading(false);
    }
  };

  const handleQuickScan = async (cardId: string) => {
    try {
      setScanLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/card-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: cardId.trim(),
          scanType: 'CHECK_IN',
          location: 'Quick Scan'
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message);
        fetchScans();
        fetchStatistics();
      } else {
        toast.error(result.error || 'Gagal melakukan scan');
      }
    } catch (error) {
      console.error('Error scanning card:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setScanLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getScanTypeIcon = (scanType: string) => {
    return scanType === 'CHECK_IN' ? 
      <LogIn className="h-4 w-4 text-green-600" /> : 
      <LogOut className="h-4 w-4 text-red-600" />;
  };

  const getScanTypeBadge = (scanType: string) => {
    return scanType === 'CHECK_IN' ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Check In</Badge> : 
      <Badge variant="destructive">Check Out</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scan className="w-6 h-6" />
            Card Scan System
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                connectionStatus === 'disabled' ? 'bg-gray-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-500 capitalize">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'disabled' ? 'Real-time Disabled' : 'Disconnected'}
              </span>
              {connectionStatus === 'disabled' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setConnectionAttempts(0);
                    setConnectionStatus('connecting');
                    initializeSocket();
                  }}
                  className="ml-2 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          </h2>
          <p className="text-gray-600">
            Sistem absensi berbasis kartu dengan QR Code
            {connectionStatus === 'disabled' && (
              <span className="text-orange-600 ml-2">
                (Real-time notifications disabled due to connection issues)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsScanDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Scan className="w-4 h-4 mr-2" />
            Scan Kartu
          </Button>
          <Button onClick={fetchScans} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Scan</p>
                  <p className="text-2xl font-bold">{statistics.overview.totalScans}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check In</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.overview.checkInCount}</p>
                </div>
                <LogIn className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check Out</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.overview.checkOutCount}</p>
                </div>
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">User Unik</p>
                  <p className="text-2xl font-bold">{statistics.overview.uniqueUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Bell className="w-5 h-5" />
              Notifikasi Real-time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div 
                  key={`${notification.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.scanType === 'CHECK_IN' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString('id-ID')}
                        {notification.location && ` • ${notification.location}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {notification.userRole}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Scan Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Quick Scan
          </CardTitle>
          <CardDescription>
            Masukkan Card ID untuk scan cepat (Check In otomatis)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              ref={cardIdInputRef}
              placeholder="Masukkan Card ID..."
              value={formData.cardId}
              onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && formData.cardId.trim()) {
                  handleQuickScan(formData.cardId);
                  setFormData(prev => ({ ...prev, cardId: '' }));
                }
              }}
              disabled={scanLoading}
            />
            <Button 
              onClick={() => {
                if (formData.cardId.trim()) {
                  handleQuickScan(formData.cardId);
                  setFormData(prev => ({ ...prev, cardId: '' }));
                }
              }}
              disabled={scanLoading || !formData.cardId.trim()}
            >
              {scanLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Scan className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>User ID</Label>
              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tipe Scan</Label>
              <Select value={filters.scanType} onValueChange={(value) => setFilters(prev => ({ ...prev, scanType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="CHECK_IN">Check In</SelectItem>
                  <SelectItem value="CHECK_OUT">Check Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dari Tanggal</Label>
              <Input
                type="datetime-local"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label>Sampai Tanggal</Label>
              <Input
                type="datetime-local"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Riwayat Scan Terbaru
          </CardTitle>
          <CardDescription>
            Menampilkan {scans.length} dari {pagination.total} scan
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : scans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Belum ada data scan
                  </TableCell>
                </TableRow>
              ) : (
                scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatDateTime(scan.scanTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{scan.user.name}</div>
                        <div className="text-sm text-gray-500">
                          {scan.user.nis || scan.user.nip || scan.user.email}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {scan.user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {scan.cardId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getScanTypeIcon(scan.scanType)}
                        {getScanTypeBadge(scan.scanType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{scan.location || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {scan.isValid ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <UserX className="h-3 w-3 mr-1" />
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Dialog */}
      <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Kartu</DialogTitle>
            <DialogDescription>
              Masukkan detail untuk scan kartu absensi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <Label htmlFor="cardId">Card ID</Label>
              <Input
                id="cardId"
                value={formData.cardId}
                onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
                placeholder="Masukkan Card ID"
                required
                autoFocus
              />
            </div>
            
            <div>
              <Label htmlFor="scanType">Tipe Scan</Label>
              <Select value={formData.scanType} onValueChange={(value: 'CHECK_IN' | 'CHECK_OUT') => setFormData(prev => ({ ...prev, scanType: value }))}>
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
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Contoh: Gerbang Utama"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan tambahan (opsional)"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsScanDialogOpen(false)}
                disabled={scanLoading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={scanLoading}
              >
                {scanLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Scan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}