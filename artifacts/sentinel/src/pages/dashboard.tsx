import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useListPatients, getListPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users, Bed, AlertTriangle, Heart, Wind, Thermometer } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      refetchInterval: 1500,
    }
  });

  const { data: patients, isLoading: isPatientsLoading } = useListPatients({
    query: {
      queryKey: getListPatientsQueryKey(),
      refetchInterval: 3000,
    }
  });

  if (isSummaryLoading || !summary || isPatientsLoading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading dashboard telemetry...</div>;
  }

  const occupancyPercentage = summary.totalBeds > 0 ? (summary.occupiedBeds / summary.totalBeds) * 100 : 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ICU Overview</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live Telemetry Active
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalPatients}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="bg-card border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/10 rounded-bl-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-destructive">Critical</CardTitle>
              <Activity className="h-4 w-4 text-destructive animate-pulse" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-destructive">{summary.criticalCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="bg-card border-amber-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-500">Warning</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-amber-500">{summary.warningCount}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bed Occupancy</CardTitle>
              <Bed className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{summary.occupiedBeds}</div>
                <div className="text-sm font-medium text-muted-foreground">/ {summary.totalBeds}</div>
              </div>
              <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${occupancyPercentage > 90 ? 'bg-destructive' : occupancyPercentage > 75 ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Patients Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Active Patients</h2>
            <Link href="/patients" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients?.slice(0, 6).map((patient, i) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.3 }}
              >
                <Link href={`/patients/${patient.id}`}>
                  <Card className="h-full hover:bg-sidebar transition-colors cursor-pointer border-l-2" style={{ borderLeftColor: patient.status === 'critical' ? 'hsl(var(--destructive))' : patient.status === 'warning' ? '#f59e0b' : '#10b981' }}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{patient.name}</div>
                          <div className="text-xs text-muted-foreground">Bed {patient.bedNumber || "N/A"}</div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase px-1.5 py-0 ${patient.status === 'critical' ? 'border-destructive text-destructive' : patient.status === 'warning' ? 'border-amber-500 text-amber-500' : 'border-green-500 text-green-500'}`}>
                          {patient.status}
                        </Badge>
                      </div>
                      
                      {patient.latestVitals ? (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                            <span>{Math.round(patient.latestVitals.heartRate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Wind className="h-3.5 w-3.5 text-blue-400" />
                            <span>{Math.round(patient.latestVitals.spo2)}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                            <span>{patient.latestVitals.temperature.toFixed(1)}°</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-muted-foreground">No telemetry</div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Alerts Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Alerts</h2>
            <Link href="/alerts" className="text-sm text-primary hover:underline">Feed</Link>
          </div>
          
          <Card className="bg-card/50">
            <CardContent className="p-0">
              {summary.recentAlerts.length > 0 ? (
                <div className="divide-y divide-border">
                  {summary.recentAlerts.map((alert, i) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.4 }}
                      className={`p-4 ${alert.severity === 'critical' && !alert.acknowledged ? 'bg-destructive/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium leading-none">{alert.patientName}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(alert.timestamp), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No recent alerts.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
