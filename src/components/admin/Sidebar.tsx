'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CreditCard, 
  Scan, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  stats: any;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, user, stats, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      color: 'text-red-600',
      badge: stats.unreadNotifications
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <GraduationCap className="h-8 w-8 text-primary flex-shrink-0" />
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin</h1>
                <p className="text-xs text-gray-500">SMP ASH</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-8 w-8"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-3'} ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
              }`}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3 w-full">
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-primary-foreground' : item.color
                }`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </Button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>
              {user?.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Administrator
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="p-1 h-8 w-8 flex-shrink-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}