import { useEffect, useRef } from 'react';

import { maskToCss } from '../engine/colors';
import type { BeamPath } from '../engine/types';

interface RaysCanvasProps {
  width: number;
  height: number;
  cellSize: number;
  paths: BeamPath[];
}

function toPixel(cell: number, cellSize: number): number {
  return cell * cellSize + cellSize / 2;
}

export function RaysCanvas({ width, height, cellSize, paths }: RaysCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    for (const path of paths) {
      if (path.points.length < 2) {
        continue;
      }

      const color = maskToCss(path.color);
      const alpha = Math.max(0.35, Math.min(0.9, path.intensity / 300));

      ctx.beginPath();
      ctx.moveTo(toPixel(path.points[0].x, cellSize), toPixel(path.points[0].y, cellSize));
      for (let i = 1; i < path.points.length; i += 1) {
        ctx.lineTo(toPixel(path.points[i].x, cellSize), toPixel(path.points[i].y, cellSize));
      }

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * 0.18;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }, [cellSize, height, paths, width]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
