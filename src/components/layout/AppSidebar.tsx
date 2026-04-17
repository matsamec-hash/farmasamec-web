'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Tractor,
  Wheat,
  Map,
  MapPinned,
  Settings,
  ChevronDown,
  LogOut,
  Leaf,
  CalendarDays,
  ClipboardList,
  Droplets,
  FileText,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/auth/actions';

const NAV_ITEMS = [
  { label: 'Přehled', href: '/', icon: LayoutDashboard },
  { label: 'Zvířata', href: '/zvirata', icon: Leaf },
  { label: 'Pole & Parcely', href: '/pole', icon: Map },
  { label: 'Katastr', href: '/katastr', icon: MapPinned },
  { label: 'Operace na poli', href: '/operace', icon: Wheat },
  { label: 'Stroje', href: '/stroje', icon: Tractor },
  { label: 'Kalendář', href: '/kalendar', icon: CalendarDays },
  { label: 'Úkoly', href: '/ukoly', icon: ClipboardList },
  { label: 'PHM', href: '/phm', icon: Droplets },
  { label: 'Exporty', href: '/exporty', icon: FileText },
  { label: 'Nastavení', href: '/nastaveni', icon: Settings },
];

interface AppSidebarProps {
  userEmail?: string;
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'FS';

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c9a6e] text-lg">
            🌾
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">FarmaSamec</p>
            <p className="text-xs text-gray-500">Webová správa</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-1">
            Navigace
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive =
                href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={isActive}
                    className={cn(
                      'rounded-lg transition-colors',
                      isActive
                        ? 'bg-[#7c9a6e]/10 text-[#7c9a6e] font-semibold'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    <Icon size={17} />
                    <span className="text-sm">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#7c9a6e]/20 text-[#7c9a6e] text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-gray-800 truncate">{userEmail}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52">
            <DropdownMenuItem className="text-red-600 focus:text-red-600 p-0">
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 px-2 py-1.5">
                  <LogOut size={14} />
                  Odhlásit se
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
