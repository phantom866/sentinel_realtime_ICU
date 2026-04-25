import { useListBeds, getListBedsQueryKey, useAllocateBed, useReleaseBed, useListPatients, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed as BedIcon, User, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function Beds() {
  const queryClient = useQueryClient();
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);

  const { data: beds, isLoading: isLoadingBeds } = useListBeds({
    query: {
      queryKey: getListBedsQueryKey(),
      refetchInterval: 3000,
    }
  });

  const { data: patients } = useListPatients({
    query: {
      queryKey: getListPatientsQueryKey(),
    }
  });

  const allocateBed = useAllocateBed();
  const releaseBed = useReleaseBed();

  const handleAllocate = () => {
    if (selectedBed && selectedPatientId) {
      allocateBed.mutate({ id: selectedBed, data: { patientId: parseInt(selectedPatientId) } }, {
        onSuccess: () => {
          setIsAllocateDialogOpen(false);
          setSelectedPatientId("");
          queryClient.invalidateQueries({ queryKey: getListBedsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        }
      });
    }
  };

  const handleRelease = (bedId: number) => {
    if (confirm("Are you sure you want to release this bed?")) {
      releaseBed.mutate({ id: bedId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBedsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        }
      });
    }
  };

  const groupedBeds = beds?.reduce((acc, bed) => {
    if (!acc[bed.ward]) {
      acc[bed.ward] = [];
    }
    acc[bed.ward].push(bed);
    return acc;
  }, {} as Record<string, typeof beds>);

  const getBedStyle = (bed: any) => {
    if (!bed.occupied) return "border-primary/50 border-dashed bg-background/50 hover:bg-primary/5";
    if (bed.patientStatus === "critical") return "border-destructive bg-destructive/10";
    if (bed.patientStatus === "warning") return "border-amber-500 bg-amber-500/10";
    return "border-blue-500 bg-blue-500/10";
  };

  const getBedIconColor = (bed: any) => {
    if (!bed.occupied) return "text-primary/50";
    if (bed.patientStatus === "critical") return "text-destructive";
    if (bed.patientStatus === "warning") return "text-amber-500";
    return "text-blue-500";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ICU Bed Management</h1>
        <p className="text-muted-foreground mt-1">Real-time occupancy and allocation status.</p>
      </div>

      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Bed</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">Select a patient to allocate to this bed.</p>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} ({p.mrn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAllocate} disabled={!selectedPatientId || allocateBed.isPending}>
              {allocateBed.isPending ? "Allocating..." : "Allocate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoadingBeds ? (
        <div className="space-y-8 animate-pulse">
          {[1,2].map(ward => (
            <div key={ward} className="space-y-4">
              <div className="h-8 w-48 bg-card rounded"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1,2,3,4,5,6].map(bed => (
                  <div key={bed} className="h-32 bg-card rounded-lg border border-border"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBeds || {}).map(([ward, wardBeds]) => (
            <div key={ward} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {ward}
                <Badge variant="secondary" className="ml-2">
                  {wardBeds.filter(b => b.occupied).length} / {wardBeds.length} Occupied
                </Badge>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <AnimatePresence>
                  {wardBeds.map((bed, i) => (
                    <motion.div
                      key={bed.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card 
                        className={`h-full cursor-pointer transition-all duration-300 ${getBedStyle(bed)}`}
                        onClick={() => {
                          if (!bed.occupied) {
                            setSelectedBed(bed.id);
                            setIsAllocateDialogOpen(true);
                          } else {
                            handleRelease(bed.id);
                          }
                        }}
                      >
                        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                          <span className="font-bold text-lg">{bed.bedNumber}</span>
                          <BedIcon className={`h-5 w-5 ${getBedIconColor(bed)}`} />
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          {bed.occupied ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-sm font-medium line-clamp-1">
                                <User className="h-3.5 w-3.5" />
                                {bed.patientName}
                              </div>
                              {bed.patientStatus === "critical" && (
                                <Badge variant="destructive" className="text-[10px] w-full justify-center px-1 py-0 h-5">CRITICAL</Badge>
                              )}
                              {bed.patientStatus === "warning" && (
                                <Badge variant="outline" className="text-[10px] w-full justify-center px-1 py-0 h-5 bg-amber-500/20 text-amber-500 border-amber-500/50">WARNING</Badge>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-2">
                              <span className="opacity-70 text-xs uppercase tracking-wider font-semibold">Available</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
