import { WifiOff, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  isOnline: boolean;
  hasPendingSync: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function OfflineIndicator({
  isOnline,
  hasPendingSync,
  onSync,
  isSyncing,
}: OfflineIndicatorProps) {
  if (isOnline && !hasPendingSync) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg transition-all",
        !isOnline
          ? "bg-destructive/90 text-destructive-foreground"
          : "bg-warning/90 text-warning-foreground cursor-pointer hover:bg-warning"
      )}
      onClick={isOnline && hasPendingSync ? onSync : undefined}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline - Changes saved locally</span>
        </>
      ) : hasPendingSync ? (
        <>
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          <span>{isSyncing ? "Syncing..." : "Tap to sync changes"}</span>
        </>
      ) : null}
    </div>
  );
}
