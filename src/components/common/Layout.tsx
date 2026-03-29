import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, BarChart3, LogOut, ChevronLeft, ChevronRight, User, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const baseNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trackers', icon: FolderKanban, label: 'Trackers' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navItems = user?.isSuperAdmin
    ? [...baseNavItems, { to: '/admin', icon: Shield, label: 'Admin' }]
    : baseNavItems;
  const logout = useLogout();
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen overflow-hidden flex bg-muted/40">
        {/* Desktop Sidebar — hidden on mobile */}
        <aside
          className={cn(
            'hidden lg:flex flex-col bg-white border-r border-border transition-all duration-200 shrink-0 h-full',
            collapsed ? 'w-16' : 'w-60'
          )}
        >
          {/* Brand */}
          <div className={cn('flex items-center h-14 border-b border-border shrink-0', collapsed ? 'justify-center px-2' : 'px-4')}>
            {!collapsed && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-foreground text-sm truncate">Lead Tracker</span>
              </div>
            )}
            {collapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn('flex-1 py-3 space-y-1', collapsed ? 'px-2' : 'px-3')}>
            {navItems.map((item) => {
              const active = isActive(item.to);
              const linkContent = (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-md transition-colors text-sm font-medium',
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                    active
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="w-4.5 h-4.5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return linkContent;
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="flex justify-center py-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <Separator className="bg-border" />

          {/* User section */}
          <div className={cn('shrink-0 py-3', collapsed ? 'px-2' : 'px-3')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-3 w-full rounded-md transition-colors hover:bg-accent text-left',
                    collapsed ? 'justify-center p-2' : 'px-3 py-2'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-accent text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">
            <Outlet />
          </main>
        </div>

        {/* Mobile Bottom Navigation — visible only on mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border lg:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] px-3 py-1.5 rounded-lg transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground active:bg-accent'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                  <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>{item.label}</span>
                </Link>
              );
            })}

            {/* Profile / Logout */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] px-3 py-1.5 rounded-lg text-muted-foreground active:bg-accent transition-colors">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-accent text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium">Profile</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
