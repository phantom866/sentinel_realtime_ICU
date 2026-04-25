import { useListAlerts, getListAlertsQueryKey, useAcknowledgeAlert } from "@workspace/api-client-react";
import { format } from "date-fns";
import { AlertTriangle, Info, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function Alerts() {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading } = useListAlerts({ limit: 50 }, {
    query: {
      queryKey: getListAlertsQueryKey({ limit: 50 }),
      refetchInterval: 1500,
    }
  });

  const acknowledgeAlert = useAcknowledgeAlert();

  const handleAcknowledge = (id: number) => {
    acknowledgeAlert.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ limit: 50 }) });
      }
    });
  };

  const getAlertStyle = (severity: string, acknowledged: boolean) => {
    if (acknowledged) return "border-border bg-card/50 opacity-60";
    if (severity === "critical") return "border-destructive bg-destructive/10 shadow-[0_0_15px_rgba(220,38,38,0.15)] pulse-red";
    if (severity === "warning") return "border-amber-500/50 bg-amber-500/10";
    return "border-primary/30 bg-primary/5";
  };

  const getAlertIcon = (severity: string) => {
    if (severity === "critical") return <AlertTriangle className="h-5 w-5 text-destructive" />;
    if (severity === "warning") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    return <Info className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
        <p className="text-muted-foreground mt-1">Live feed of all monitoring alerts across the ICU.</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes subtle-pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .pulse-red {
          animation: subtle-pulse 2s infinite;
        }
      `}} />

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-card rounded-lg border border-border"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {alerts?.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-lg border flex gap-4 transition-all ${getAlertStyle(alert.severity, alert.acknowledged)}`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{alert.patientName}</span>
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {alert.type}
                      </Badge>
                      {alert.acknowledged && (
                        <Badge variant="outline" className="bg-background flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ack
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(alert.timestamp), "HH:mm:ss")}
                    </div>
                  </div>
                  <p className={alert.acknowledged ? "text-muted-foreground" : "text-foreground"}>
                    {alert.message}
                  </p>
                  {alert.value !== null && alert.value !== undefined && (
                    <div className="text-sm font-mono mt-2 bg-background/50 inline-block px-2 py-1 rounded">
                      Reading: {alert.value.toFixed(2)}
                    </div>
                  )}
                </div>
                {!alert.acknowledged && (
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgeAlert.isPending}
                    >
                      Acknowledge
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {alerts?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
              No alerts found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
