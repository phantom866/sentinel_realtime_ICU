import { Link, useLocation } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Activity, LayoutDashboard, Users, Bed, Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const { data: summary } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      refetchInterval: 1500,
    }
  });

  const activeAlerts = summary?.activeAlerts || 0;

  const NavItems = () => (
    <>
      <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === "/" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
        <LayoutDashboard className="h-5 w-5" />
        Dashboard
      </Link>
      <Link href="/patients" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/patients") ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
        <Users className="h-5 w-5" />
        Patients
      </Link>
      <Link href="/beds" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/beds") ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
        <Bed className="h-5 w-5" />
        ICU Beds
      </Link>
      <Link href="/alerts" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/alerts") ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
        <Bell className="h-5 w-5" />
        Alerts
        {activeAlerts > 0 && (
          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {activeAlerts}
          </span>
        )}
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <Activity className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg tracking-tight">SENTINEL</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItems />
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={logout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-sidebar-border">
                <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                  <Activity className="h-6 w-6 text-primary mr-2" />
                  <span className="font-bold text-lg tracking-tight text-sidebar-foreground">SENTINEL</span>
                </div>
                <nav className="p-3 py-4 space-y-1">
                  <NavItems />
                </nav>
                <div className="p-4 border-t border-sidebar-border absolute bottom-0 w-full">
                  <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={logout}>
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="font-semibold hidden md:block">Project Sentinel ICU</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {activeAlerts > 0 ? (
              <div className="flex items-center text-sm font-medium text-destructive">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
                {activeAlerts} Active Alerts
              </div>
            ) : (
              <div className="flex items-center text-sm font-medium text-green-500">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                All Clear
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
