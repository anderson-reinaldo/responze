import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Player } from '@/lib/realApi';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const [lastKnownPlayers, setLastKnownPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const handleRankingUpdate = () => {
      const currentPlayers = queryClient.getQueryData<Player[]>(['ranking']) || [];
      
      if (lastKnownPlayers.length > 0) {
        // Verifica novos grupos
        const newGroups = currentPlayers.filter(
          player => !lastKnownPlayers.some(known => known.group === player.group)
        );

        // Verifica grupos que melhoraram o score
        const improvedGroups = currentPlayers.filter(player => {
          const oldPlayer = lastKnownPlayers.find(known => known.group === player.group);
          return oldPlayer && player.score > oldPlayer.score;
        });

        // Notifica novos grupos
        newGroups.forEach(player => {
          toast.success(`🎉 Novo grupo "${player.group}" entrou no ranking com ${player.score} pontos!`, {
            duration: 4000,
          });
        });

        // Notifica melhorias
        improvedGroups.forEach(player => {
          const oldPlayer = lastKnownPlayers.find(known => known.group === player.group);
          if (oldPlayer) {
            toast.info(`🚀 Grupo "${player.group}" melhorou de ${oldPlayer.score} para ${player.score} pontos!`, {
              duration: 3000,
            });
          }
        });

        // Verifica mudanças no pódio
        if (currentPlayers.length > 0 && lastKnownPlayers.length > 0) {
          const newLeader = currentPlayers[0];
          const oldLeader = lastKnownPlayers[0];
          
          if (newLeader && oldLeader && newLeader.group !== oldLeader.group) {
            toast.success(`👑 Novo líder: ${newLeader.group} com ${newLeader.score} pontos!`, {
              duration: 5000,
            });
          }
        }
      }

      setLastKnownPlayers(currentPlayers);
    };

    // Escuta mudanças no cache do ranking
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.query.queryKey[0] === 'ranking' && event.type === 'updated') {
        handleRankingUpdate();
      }
    });

    return unsubscribe;
  }, [queryClient, lastKnownPlayers]);

  return null;
}
