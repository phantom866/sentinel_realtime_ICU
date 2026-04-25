import { useState } from "react";
import { useListPatients, getListPatientsQueryKey, useCreatePatient, Patient } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Activity, Heart, Thermometer, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Patients() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: patients, isLoading } = useListPatients({
    query: {
      queryKey: getListPatientsQueryKey(),
      refetchInterval: 3000,
    }
  });

  const createPatient = useCreatePatient();

  const handleCreatePatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string),
      mrn: formData.get("mrn") as string,
      gender: formData.get("gender") as string,
      ward: formData.get("ward") as string,
      bedNumber: formData.get("bedNumber") as string,
      diagnosis: formData.get("diagnosis") as string,
      attendingPhysician: formData.get("attendingPhysician") as string,
    };
    
    createPatient.mutate({ data }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
      }
    });
  };

  const filteredPatients = patients?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    if (status === "critical") return "bg-destructive/20 text-destructive border-destructive/50";
    if (status === "warning") return "bg-amber-500/20 text-amber-500 border-amber-500/50";
    return "bg-green-500/20 text-green-500 border-green-500/50";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all ICU patients.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreatePatient}>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mrn">MRN</Label>
                    <Input id="mrn" name="mrn" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" name="gender" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward</Label>
                    <Input id="ward" name="ward" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedNumber">Bed Number</Label>
                    <Input id="bedNumber" name="bedNumber" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Input id="diagnosis" name="diagnosis" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="attendingPhysician">Attending Physician</Label>
                    <Input id="attendingPhysician" name="attendingPhysician" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPatient.isPending}>
                  {createPatient.isPending ? "Adding..." : "Add Patient"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or MRN..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>All</Button>
          <Button variant={filterStatus === "critical" ? "destructive" : "outline"} onClick={() => setFilterStatus("critical")}>Critical</Button>
          <Button variant={filterStatus === "warning" ? "secondary" : "outline"} className={filterStatus === "warning" ? "bg-amber-500 text-white hover:bg-amber-600" : ""} onClick={() => setFilterStatus("warning")}>Warning</Button>
          <Button variant={filterStatus === "normal" ? "secondary" : "outline"} className={filterStatus === "normal" ? "bg-green-600 text-white hover:bg-green-700" : ""} onClick={() => setFilterStatus("normal")}>Normal</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-card rounded-lg border border-border"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients?.map((patient, i) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/patients/${patient.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer border-l-4" style={{ borderLeftColor: patient.status === 'critical' ? 'hsl(var(--destructive))' : patient.status === 'warning' ? '#f59e0b' : '#10b981' }}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1 flex gap-2">
                        <span>{patient.mrn}</span>
                        <span>•</span>
                        <span>{patient.ward} / Bed {patient.bedNumber || "Unassigned"}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`uppercase ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-4 line-clamp-1">{patient.diagnosis || "No diagnosis"}</div>
                    
                    {patient.latestVitals ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-background rounded-md p-2 flex flex-col items-center justify-center">
                          <Heart className="h-4 w-4 text-rose-500 mb-1" />
                          <span className="font-bold">{Math.round(patient.latestVitals.heartRate)}</span>
                          <span className="text-[10px] text-muted-foreground">BPM</span>
                        </div>
                        <div className="bg-background rounded-md p-2 flex flex-col items-center justify-center">
                          <Wind className="h-4 w-4 text-blue-400 mb-1" />
                          <span className="font-bold">{Math.round(patient.latestVitals.spo2)}%</span>
                          <span className="text-[10px] text-muted-foreground">SpO2</span>
                        </div>
                        <div className="bg-background rounded-md p-2 flex flex-col items-center justify-center">
                          <Thermometer className="h-4 w-4 text-amber-500 mb-1" />
                          <span className="font-bold">{patient.latestVitals.temperature.toFixed(1)}°</span>
                          <span className="text-[10px] text-muted-foreground">Temp</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-background rounded-md p-4 text-center text-sm text-muted-foreground">
                        No recent vitals available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {filteredPatients?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
              No patients found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
