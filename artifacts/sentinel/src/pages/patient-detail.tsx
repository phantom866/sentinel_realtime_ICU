import { useRoute } from "wouter";
import { useGetPatient, getGetPatientQueryKey, useGetPatientVitals, getGetPatientVitalsQueryKey, usePredictRisk, getPredictRiskQueryKey } from "@workspace/api-client-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Heart, Wind, Thermometer, Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const id = parseInt(params?.id || "0", 10);

  const { data: patient, isLoading: isLoadingPatient } = useGetPatient(id, {
    query: { enabled: !!id, queryKey: getGetPatientQueryKey(id), refetchInterval: 1500 }
  });

  const { data: vitalsHistory } = useGetPatientVitals(id, { limit: 60 }, {
    query: { enabled: !!id, queryKey: getGetPatientVitalsQueryKey(id, { limit: 60 }), refetchInterval: 1500 }
  });

  const { data: riskPrediction } = usePredictRisk(id, {
    query: { enabled: !!id, queryKey: getPredictRiskQueryKey(id), refetchInterval: 5000 }
  });

  if (isLoadingPatient || !patient) {
    return <div className="p-8 animate-pulse text-muted-foreground">Loading patient data...</div>;
  }

  const latestVitals = patient.latestVitals;
  
  const chartData = vitalsHistory?.map(v => ({
    ...v,
    time: format(new Date(v.timestamp), "HH:mm:ss")
  })) || [];

  const getStatusBadge = (status: string) => {
    if (status === "critical") return <Badge variant="destructive" className="uppercase text-sm px-3 py-1">CRITICAL</Badge>;
    if (status === "warning") return <Badge variant="outline" className="uppercase text-sm px-3 py-1 bg-amber-500/20 text-amber-500 border-amber-500/50">WARNING</Badge>;
    return <Badge variant="outline" className="uppercase text-sm px-3 py-1 bg-green-500/20 text-green-500 border-green-500/50">NORMAL</Badge>;
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'low': return 'text-green-500';
      case 'moderate': return 'text-amber-500';
      case 'high': return 'text-orange-500';
      case 'severe': return 'text-destructive';
      default: return 'text-foreground';
    }
  };

  const VitalCard = ({ title, value, unit, icon: Icon, colorClass, delay }: any) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <div className={`text-4xl font-bold tracking-tighter ${colorClass}`}>{value || "--"}</div>
            <div className="text-sm font-medium text-muted-foreground">{unit}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sidebar p-6 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
            {getStatusBadge(patient.status)}
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            <span><span className="text-foreground/60 mr-1">MRN:</span> {patient.mrn}</span>
            <span>•</span>
            <span><span className="text-foreground/60 mr-1">Age:</span> {patient.age} {patient.gender && `(${patient.gender})`}</span>
            <span>•</span>
            <span><span className="text-foreground/60 mr-1">Location:</span> {patient.ward} - Bed {patient.bedNumber || "Unassigned"}</span>
          </div>
          <div className="mt-3 text-sm flex gap-6">
            <div><span className="text-muted-foreground">Diagnosis:</span> <span className="font-medium">{patient.diagnosis || "Unknown"}</span></div>
            <div><span className="text-muted-foreground">Attending:</span> <span className="font-medium">{patient.attendingPhysician || "Unassigned"}</span></div>
          </div>
        </div>
      </div>

      {/* Vitals Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <VitalCard title="Heart Rate" value={latestVitals ? Math.round(latestVitals.heartRate) : null} unit="BPM" icon={Heart} colorClass="text-rose-500" delay={0.1} />
        <VitalCard title="SpO2" value={latestVitals ? Math.round(latestVitals.spo2) : null} unit="%" icon={Wind} colorClass="text-blue-400" delay={0.2} />
        <VitalCard title="Blood Pressure" value={latestVitals ? `${Math.round(latestVitals.bpSystolic)}/${Math.round(latestVitals.bpDiastolic)}` : null} unit="mmHg" icon={Activity} colorClass="text-purple-400" delay={0.3} />
        <VitalCard title="Temperature" value={latestVitals ? latestVitals.temperature.toFixed(1) : null} unit="°C" icon={Thermometer} colorClass="text-amber-500" delay={0.4} />
        <VitalCard title="Resp Rate" value={latestVitals?.respiratoryRate ? Math.round(latestVitals.respiratoryRate) : null} unit="RPM" icon={Wind} colorClass="text-teal-400" delay={0.5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Heart Rate History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={8} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="heartRate" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">SpO2 History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={8} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="spo2" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Temperature History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={8} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="temperature" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Risk Score Section */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-b from-card to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                AI Risk Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskPrediction ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-background bg-card shadow-lg relative">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${riskPrediction.riskScore * 2.89} 289`} strokeDashoffset="0" className={getRiskColor(riskPrediction.riskLevel)} transform="rotate(-90 50 50)" strokeLinecap="round" />
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold">{riskPrediction.riskScore}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <div className={`mt-4 font-bold uppercase tracking-widest ${getRiskColor(riskPrediction.riskLevel)}`}>
                      {riskPrediction.riskLevel} RISK
                    </div>
                  </div>

                  {riskPrediction.factors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Contributing Factors:</h4>
                      <ul className="space-y-2">
                        {riskPrediction.factors.map((factor, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 bg-background/50 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {riskPrediction.recommendation && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-2 text-primary">
                        <ShieldCheck className="h-4 w-4" /> Recommended Action
                      </h4>
                      <p className="text-sm">{riskPrediction.recommendation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground animate-pulse">
                  Analyzing latest telemetry...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
