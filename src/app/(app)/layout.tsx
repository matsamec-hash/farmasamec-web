import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/prihlaseni');

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user.email} />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-12 items-center gap-2 px-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <SidebarTrigger className="-ml-1 text-gray-500" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-gray-400">FarmaSamec</span>
        </header>

        <main className="flex-1 p-6 bg-[#faf8f5] min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
