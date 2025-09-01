import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atualiza timestamp a cada minuto
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full glass ${
      isOnline ? 'text-quiz-success' : 'text-quiz-error'
    } text-sm font-medium`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
      <div className="text-xs text-foreground/60">
        {lastUpdate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}
