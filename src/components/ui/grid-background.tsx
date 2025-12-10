import { cn } from '../../lib/utils';

interface GridBackgroundProps {
  className?: string;
  gridColor?: string;
  gridSize?: number;
}

export function GridBackground({ 
  className, 
  gridColor = 'rgba(255, 255, 255, 0.05)',
  gridSize = 20 
}: GridBackgroundProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-0",
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(${gridColor} 1px, transparent 1px),
          linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}




