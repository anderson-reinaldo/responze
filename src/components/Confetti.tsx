import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'triangle';
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
}

const colors = [
  '#FFD700', // Dourado
  '#FF6B6B', // Vermelho
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul
  '#FFA07A', // Salmon
  '#98D8C8', // Verde claro
  '#F7DC6F', // Amarelo
  '#BB8FCE', // Roxo claro
  '#85C1E9', // Azul claro
  '#F8C471', // Laranja claro
];

export const Confetti = ({ active, duration = 3000, particleCount = 150 }: ConfettiProps) => {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      // Criar partículas
      const newParticles: ConfettiPiece[] = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4, // 4-12px
          speedX: (Math.random() - 0.5) * 4, // -2 a 2
          speedY: Math.random() * 3 + 2, // 2-5
          rotationSpeed: (Math.random() - 0.5) * 10, // -5 a 5
          shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
        });
      }
      setParticles(newParticles);
      setIsVisible(true);

      // Remover após a duração
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setParticles([]), 1000); // Aguarda fade out
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, particleCount]);

  useEffect(() => {
    if (particles.length === 0) return;

    const animationFrame = requestAnimationFrame(function animate() {
      setParticles(currentParticles =>
        currentParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          rotation: particle.rotation + particle.rotationSpeed,
          speedY: particle.speedY + 0.1, // Gravidade
        })).filter(particle => particle.y < window.innerHeight + 50) // Remove partículas que saíram da tela
      );

      if (isVisible) {
        requestAnimationFrame(animate);
      }
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [particles.length, isVisible]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute transition-opacity duration-1000"
          style={{
            left: particle.x,
            top: particle.y,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: isVisible ? 1 : 0,
          }}
        >
          <div
            className={`shadow-lg animate-sparkle ${
              particle.shape === 'circle' ? 'rounded-full' : 
              particle.shape === 'triangle' ? 'triangle' : 'rounded-sm'
            }`}
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              clipPath: particle.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes sparkle {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.2) rotate(180deg); }
        }
        .animate-sparkle {
          animation: sparkle 0.5s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};
