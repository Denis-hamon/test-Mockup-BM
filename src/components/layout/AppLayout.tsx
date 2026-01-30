import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
