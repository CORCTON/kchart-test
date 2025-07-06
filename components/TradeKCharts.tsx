"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries, // Import the series type
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  LineStyle,
} from "lightweight-charts";
import type { DailyData, CurrentData } from "@/mock/data";

// Helper function to format data for the price chart
const formatChartData = (data: DailyData[]) => {
  return data.map((d) => ({
    time: d.date as Time,
    value: d.close,
  }));
};

// Helper function to format volume data for the volume chart
const formatVolumeData = (data: DailyData[], factor: number) => {
  const totalVolumeData = data.map((d) => ({
    time: d.date as Time,
    value: (d.buy_volume + d.sell_volume) / factor, // Total volume as background
    color: '#22c55e', // Green for total (will show buy volume)
  }));

  const sellVolumeData = data.map((d) => ({
    time: d.date as Time,
    value: d.sell_volume / factor, // Only sell volume
    color: '#ef4444', // Red for sell volume
  }));

  return { totalVolumeData, sellVolumeData };
};

interface TradeKChartsProps {
  initialData: DailyData[];
}

export default function TradeKCharts({ initialData }: TradeKChartsProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [volumeUnit, setVolumeUnit] = useState("手");
  const volumeFactorRef = useRef(1);
  const totalVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sellVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || initialData.length === 0) return;

    // Initialize chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 450, // Combined height
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
        attributionLogo: false,
      },
      grid: { vertLines: { color: "#f0f0f0" }, horzLines: { color: "#f0f0f0" } },
      timeScale: {
        borderColor: "#cccccc",
        fixLeftEdge: true,
      },
      rightPriceScale: {
        borderColor: 'transparent',
      },
      // Define a separate price scale for volume, but keep it invisible
      leftPriceScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    // Add Area series for price chart
    seriesRef.current = chartRef.current.addSeries(AreaSeries, {
      lineColor: "#FFC700",
      topColor: "rgba(255, 199, 0, 0.4)",
      bottomColor: "rgba(255, 199, 0, 0)",
      lineWidth: 2,
      priceLineVisible: true,
      priceLineStyle: LineStyle.Solid,
      priceLineColor: "#FFC700",
    });

    // Add Histogram series for volume chart - total volume (green, background layer)
    totalVolumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: '#22c55e',
      priceLineVisible: false,
      priceScaleId: 'left', // Assign to the new price scale, creating a new pane
    });

    // Add Histogram series for volume chart - sell volume (red, overlay layer)
    sellVolumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: '#ef4444',
      priceLineVisible: false,
      priceScaleId: 'left', // Assign to the new price scale, creating a new pane
    });

    const maxVolume = Math.max(...initialData.map(d => d.buy_volume + d.sell_volume));
    if (maxVolume > 999) {
      const power = Math.floor(Math.log10(maxVolume)) - 2;
      volumeFactorRef.current = Math.pow(10, power);
      if (power >= 3 && power < 6) setVolumeUnit("千手");
      else if (power >= 6 && power < 9) setVolumeUnit("百万手");
      else if (power >= 9) setVolumeUnit("十亿手");
    }

    const formattedData = formatChartData(initialData);
    const { totalVolumeData, sellVolumeData } = formatVolumeData(initialData, volumeFactorRef.current);
    
    if (seriesRef.current) {
      seriesRef.current.setData(formattedData);
    }
    if (totalVolumeSeriesRef.current) {
      totalVolumeSeriesRef.current.setData(totalVolumeData);
    }
    if (sellVolumeSeriesRef.current) {
      sellVolumeSeriesRef.current.setData(sellVolumeData);
    }

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }

    // SSE connection for live updates
    const eventSource = new EventSource("/api/current/1");
    eventSource.onmessage = (event) => {
      const currentData: CurrentData = JSON.parse(event.data);
      const lastOriginalData = formattedData[formattedData.length - 1];
      
      if (currentData.data.length > 0 && seriesRef.current && totalVolumeSeriesRef.current && sellVolumeSeriesRef.current && lastOriginalData) {
        const latestCurrentData = currentData.data[currentData.data.length - 1];
        const newPrice = latestCurrentData.price;
        
        // Update price chart
        seriesRef.current.update({
          time: lastOriginalData.time,
          value: newPrice,
        });

        // Update volume charts
        totalVolumeSeriesRef.current.update({
          time: lastOriginalData.time,
          value: (latestCurrentData.buy_volume + latestCurrentData.sell_volume) / volumeFactorRef.current,
        });

        sellVolumeSeriesRef.current.update({
          time: lastOriginalData.time,
          value: latestCurrentData.sell_volume / volumeFactorRef.current,
        });
      }
    };

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 450);
      }
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      eventSource.close();
      chartRef.current?.remove();
    };
  }, [initialData]);

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-1 px-2">
        <div className="text-sm text-gray-600">交易量({volumeUnit})</div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">买入</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">卖出</span>
          </div>
        </div>
      </div>
      {/* Combined Chart */}
      <div ref={chartContainerRef} className="w-full h-[450px]" />
    </div>
  );
}
