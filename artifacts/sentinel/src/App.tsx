import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Patients from "./pages/patients";
import PatientDetail from "./pages/patient-detail";
import Beds from "./pages/beds";
import Alerts from "./pages/alerts";
import { AppLayout } from "./components/layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/patients">
        <ProtectedRoute component={Patients} />
      </Route>
      <Route path="/patients/:id">
        <ProtectedRoute component={PatientDetail} />
      </Route>
      <Route path="/beds">
        <ProtectedRoute component={Beds} />
      </Route>
      <Route path="/alerts">
        <ProtectedRoute component={Alerts} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
