import React, { useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import type { PriceData } from '../types/portfolio';

interface LineChartProps {
  data: PriceData[];
  width?: number;
  height?: number;
  color?: string;
  initialValue?: number;
}

export const LineChart: React.FC<LineChartProps> = observer(({ 
  data, 
  width: propWidth, 
  height: propHeight, 
  color = '#22d3ee', // cyan-400 default
  initialValue = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Create a copy of the data to ensure reactivity
  const dataLength = data.length;
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = propWidth || container.clientWidth - 40;
        const height = propHeight || container.clientHeight - 40;
        setDimensions({ width: Math.max(width, 400), height: Math.max(height, 200) });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [propWidth, propHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const { width, height } = dimensions;
    
    if (!canvas || dataLength === 0 || width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate min and max values
    let minValue = initialValue;
    let maxValue = initialValue;
    
    data.forEach(point => {
      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);
    });

    // Add some padding
    const padding = (maxValue - minValue) * 0.1 || 1;
    minValue -= padding;
    maxValue += padding;

    const chartPadding = 70;
    const chartWidth = width - chartPadding * 2;
    const chartHeight = height - chartPadding * 2;

    // Draw grid lines
    ctx.strokeStyle = '#262626'; // neutral-800
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = chartPadding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(chartPadding, y);
      ctx.lineTo(width - chartPadding, y);
      ctx.stroke();
    }

    // Draw glow effect under the line
    if (dataLength > 1) {
      const gradient = ctx.createLinearGradient(0, chartPadding, 0, height - chartPadding);
      gradient.addColorStop(0, color + '30'); // 30 = ~19% opacity
      gradient.addColorStop(1, color + '00'); // 00 = transparent
      
      ctx.beginPath();
      ctx.fillStyle = gradient;
      
      data.forEach((point, index) => {
        const x = chartPadding + (chartWidth / (dataLength - 1)) * index;
        const normalizedValue = (point.value - minValue) / (maxValue - minValue);
        const y = height - chartPadding - normalizedValue * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      // Complete the fill area
      ctx.lineTo(chartPadding + chartWidth, height - chartPadding);
      ctx.lineTo(chartPadding, height - chartPadding);
      ctx.closePath();
      ctx.fill();
    }

    // Draw the main line
    if (dataLength === 1) {
      // For single data point, draw a glowing dot
      const x = chartPadding + chartWidth / 2;
      const normalizedValue = (data[0].value - minValue) / (maxValue - minValue);
      const y = height - chartPadding - normalizedValue * chartHeight;
      
      // Glow
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (dataLength > 1) {
      // Draw line with glow
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;

      data.forEach((point, index) => {
        const x = chartPadding + (chartWidth / (dataLength - 1)) * index;
        const normalizedValue = (point.value - minValue) / (maxValue - minValue);
        const y = height - chartPadding - normalizedValue * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw points with glow
      data.forEach((point, index) => {
        const x = chartPadding + (chartWidth / (dataLength - 1)) * index;
        const normalizedValue = (point.value - minValue) / (maxValue - minValue);
        const y = height - chartPadding - normalizedValue * chartHeight;
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;
    }

    // Draw axes
    ctx.strokeStyle = '#404040'; // neutral-700
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartPadding, chartPadding);
    ctx.lineTo(chartPadding, height - chartPadding);
    ctx.lineTo(width - chartPadding, height - chartPadding);
    ctx.stroke();

    // Helper function to format currency with K/M suffix
    const formatYAxisValue = (value: number): string => {
      const absValue = Math.abs(value);
      if (absValue >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      } else if (absValue >= 10000) {
        return `$${(value / 1000).toFixed(1)}K`;
      } else if (absValue >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
      } else {
        return `$${value.toFixed(2)}`;
      }
    };

    // Draw labels
    ctx.fillStyle = '#a3a3a3'; // neutral-400 for better visibility
    ctx.font = '13px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Y-axis labels with improved formatting
    for (let i = 0; i <= 4; i++) {
      const value = minValue + ((maxValue - minValue) / 4) * (4 - i);
      const y = chartPadding + (chartHeight / 4) * i;
      const formattedValue = formatYAxisValue(value);
      ctx.fillText(formattedValue, chartPadding - 15, y);
    }

  }, [data, dataLength, latestValue, dimensions, color, initialValue]);

  if (dataLength === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center border border-neutral-800 rounded-lg text-neutral-500 bg-neutral-900">
        <span className="text-sm">No data available</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="border border-neutral-800 rounded-lg bg-neutral-950"
      />
    </div>
  );
});
