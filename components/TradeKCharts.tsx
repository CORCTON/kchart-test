"use client";

import {
  AreaSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineStyle,
  type Time,
} from "lightweight-charts";
import type { DailyData } from "@/mock/data";
import { useEffect, useRef } from "react";
import type { MouseEventParams } from "lightweight-charts";
import { fetchTradeSummary } from "@/lib/api";
import { transformTradeSummaryToDaily } from "@/lib/transforms";

// Helper function to format data for the price chart
const formatChartData = (data: DailyData[]) => {
  return data.map((d) => ({
    time: d.time as Time,
    value: d.close,
  }));
};

// Helper function to format volume data for the volume chart
const formatVolumeData = (data: DailyData[], factor: number) => {
  const totalVolumeData = data.map((d) => ({
    time: d.time as Time,
    value: (d.buy_volume + d.sell_volume) / factor,
    color: "#ef4444",
  }));

  const sellVolumeData = data.map((d) => ({
    time: d.time as Time,
    value: d.sell_volume / factor,
    color: "#22c55e",
  }));

  return { totalVolumeData, sellVolumeData };
};

interface TradeKChartsProps {
  initialData: DailyData[];
  projectId: string;
}

export default function TradeKCharts({ initialData, projectId }: TradeKChartsProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeFactorRef = useRef(1);
  const totalVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sellVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const dataRef = useRef(initialData);
  const lastCrosshairTimeRef = useRef<Time | null>(null);

  useEffect(() => {
    // Update ref when initialData prop changes
    dataRef.current = initialData.map((d) => ({ ...d }));
  }, [initialData]);

  useEffect(() => {
    if (!chartContainerRef.current || dataRef.current.length === 0) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.offsetHeight,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#9B9B9B",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { labelVisible: false },
      },
      timeScale: {
        borderVisible: true,
        borderColor: "#cccccc",
        visible: true,
        fixLeftEdge: true,
        timeVisible: true,
        secondsVisible: false,
        ticksVisible: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        },
      },
      rightPriceScale: { borderColor: "transparent" },
      leftPriceScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    seriesRef.current = chartRef.current.addSeries(AreaSeries, {
      lineColor: "#FFC700",
      topColor: "rgba(255, 199, 0, 0.4)",
      bottomColor: "rgba(255, 199, 0, 0)",
      lineWidth: 2,
      priceLineVisible: true,
      priceLineStyle: LineStyle.Solid,
      priceLineColor: "#FFC700",
    });
    seriesRef.current.priceScale().applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.25 },
    });

    totalVolumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: "#ef4444",
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    totalVolumeSeriesRef.current
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    sellVolumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: "#22c55e",
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    sellVolumeSeriesRef.current
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const formattedData = formatChartData(dataRef.current);
    const { totalVolumeData, sellVolumeData } = formatVolumeData(
      dataRef.current,
      volumeFactorRef.current,
    );

    seriesRef.current.setData(formattedData);
    totalVolumeSeriesRef.current.setData(totalVolumeData);
    sellVolumeSeriesRef.current.setData(sellVolumeData);
    chartRef.current.timeScale().fitContent();

    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const renderTooltipContent = (dataPoint: DailyData) => {
      const dataIndex = dataRef.current.findIndex(
        (d) => d.time === dataPoint.time,
      );
      const isLastPoint = dataIndex === dataRef.current.length - 1;

      const prevClose =
        dataIndex > 0
          ? dataRef.current[dataIndex - 1].close
          : dataPoint.open;
      const change = prevClose === 0 ? 0 : ((dataPoint.close - prevClose) / prevClose) * 100;
      const changeColor = change >= 0 ? "text-red-400" : "text-green-400";
      let limitStatus = "";
      if (change >= 9.95) limitStatus = "涨停";
      if (change <= -9.95) limitStatus = "跌停";

      const timeEl = document.getElementById("tooltip-time");
      const priceLabelEl = document.getElementById("tooltip-price-label");
      const closeEl = document.getElementById("tooltip-close");
      const changeEl = document.getElementById("tooltip-change");
      const statusContainerEl = document.getElementById(
        "tooltip-status-container",
      );
      const statusEl = document.getElementById("tooltip-status");
      const buyVolumeEl = document.getElementById("tooltip-buy-volume");
      const sellVolumeEl = document.getElementById("tooltip-sell-volume");
      const totalVolumeEl = document.getElementById("tooltip-total-volume");

      if (
        !timeEl || !priceLabelEl || !closeEl || !changeEl || !statusContainerEl ||
        !statusEl || !buyVolumeEl || !sellVolumeEl || !totalVolumeEl
      )
        return;

      priceLabelEl.innerText = isLastPoint ? "最新价" : "收盘价";
      timeEl.innerText = new Date(dataPoint.time * 1000).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      closeEl.innerText = dataPoint.close.toFixed(2);
      closeEl.className = changeColor;
      changeEl.innerText = `${change.toFixed(2)}%`;
      changeEl.className = changeColor;

      if (limitStatus) {
        statusContainerEl.style.display = "flex";
        statusEl.innerText = limitStatus;
        statusEl.className = changeColor;
      } else {
        statusContainerEl.style.display = "none";
      }

      buyVolumeEl.innerText = dataPoint.buy_volume.toLocaleString();
      sellVolumeEl.innerText = dataPoint.sell_volume.toLocaleString();
      totalVolumeEl.innerText = (
        dataPoint.buy_volume + dataPoint.sell_volume
      ).toLocaleString();
    };

    const updateTooltip = (param: MouseEventParams) => {
      lastCrosshairTimeRef.current = param.time || null;
      if (
        !param.time || param.point === undefined || !param.seriesData.size ||
        !chartContainerRef.current
      ) {
        tooltip.style.display = "none";
        return;
      }
      const dataPoint = dataRef.current.find((d) => d.time === param.time);
      if (!dataPoint) {
        tooltip.style.display = "none";
        return;
      }

      tooltip.style.display = "block";
      renderTooltipContent(dataPoint);

      const chartWidth = chartContainerRef.current.clientWidth;
      const tooltipWidth = tooltip.offsetWidth;
      const coordinate = param.point.x;
      let left = coordinate - tooltipWidth / 2;
      left = Math.max(12, left);
      if (left + tooltipWidth > chartWidth - 12) {
        left = chartWidth - tooltipWidth - 12;
      }
      tooltip.style.left = `${left}px`;
      tooltip.style.top = "12px";
    };

    chartRef.current.subscribeCrosshairMove(updateTooltip);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.offsetHeight,
        );
      }
    };
    setTimeout(handleResize, 100);

    // Polling for current data every 5 seconds
    const pollCurrentData = async () => {
      if (!projectId) return;
      try {
        const response = await fetchTradeSummary(projectId, 1);
        const newData = transformTradeSummaryToDaily(response);
        const lastDataPoint = dataRef.current[dataRef.current.length - 1];

        if (
          newData.length > 0 &&
          seriesRef.current &&
          totalVolumeSeriesRef.current &&
          sellVolumeSeriesRef.current &&
          lastDataPoint
        ) {
          const latestData = newData[0];
          seriesRef.current.update({
            time: lastDataPoint.time as Time,
            value: latestData.close,
          });
          totalVolumeSeriesRef.current.update({
            time: lastDataPoint.time as Time,
            value:
              (latestData.buy_volume + latestData.sell_volume) /
              volumeFactorRef.current,
          });
          sellVolumeSeriesRef.current.update({
            time: lastDataPoint.time as Time,
            value: latestData.sell_volume / volumeFactorRef.current,
          });

          // Update the last data point in the ref
          lastDataPoint.close = latestData.close;
          lastDataPoint.buy_volume = latestData.buy_volume;
          lastDataPoint.sell_volume = latestData.sell_volume;
          lastDataPoint.open = latestData.open;

          // If the tooltip is visible and showing the last data point, update it
          if (
            tooltip.style.display === "block" &&
            lastCrosshairTimeRef.current === lastDataPoint.time
          ) {
            renderTooltipContent(lastDataPoint);
          }
        }
      } catch (error) {
        console.error("Error fetching current data:", error);
      }
    };

    // Start polling
    const pollInterval = setInterval(pollCurrentData, 5000);

    // Fetch historical data every hour for incremental updates
    const fetchHistoricalUpdates = async () => {
      if (!projectId) return;
      try {
        const response = await fetchTradeSummary(projectId, 14);
        const newData = transformTradeSummaryToDaily(response);

        if (newData.length > 0) {
          dataRef.current = newData;

          // Update chart with new data
          const formattedData = formatChartData(dataRef.current);
          const { totalVolumeData, sellVolumeData } = formatVolumeData(
            dataRef.current,
            volumeFactorRef.current
          );

          seriesRef.current?.setData(formattedData);
          totalVolumeSeriesRef.current?.setData(totalVolumeData);
          sellVolumeSeriesRef.current?.setData(sellVolumeData);
          chartRef.current?.timeScale().fitContent();
        }
      } catch (error) {
        console.error("Error fetching historical updates:", error);
      }
    };

    // Start hourly historical updates
    const historicalInterval = setInterval(fetchHistoricalUpdates, 60 * 60 * 1000); // Every hour

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(pollInterval);
      clearInterval(historicalInterval);
      chartRef.current?.remove();
    };
  }, [projectId]);

  return (
    <div className="w-full h-full flex flex-col relative">
      <div ref={chartContainerRef} className="w-full flex-1" />
      <div
        ref={tooltipRef}
        className="absolute z-10 hidden pointer-events-none"
        style={{ top: 12, left: 12 }}
      >
        <div className="bg-black/70 text-white backdrop-blur-sm p-2 rounded-md shadow-lg text-xs">
          <div id="tooltip-time" className="font-semibold" />
          <div className="flex justify-between items-center mt-1.5 space-x-4">
            <span id="tooltip-price-label" className="text-gray-300">
              收盘价
            </span>
            <span id="tooltip-close" />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-300">涨跌幅</span>
            <span id="tooltip-change" />
          </div>
          <div
            id="tooltip-status-container"
            className="flex justify-between items-center mt-1"
          >
            <span className="text-gray-300">状态</span>
            <span id="tooltip-status" />
          </div>
          <div className="border-t border-gray-500 my-1.5" />
          <div className="flex justify-between items-center">
            <span className="text-gray-300">买入量</span>
            <span id="tooltip-buy-volume" className="text-red-400" />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-300">卖出量</span>
            <span id="tooltip-sell-volume" className="text-green-400" />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-300">总成交量</span>
            <span id="tooltip-total-volume" />
          </div>
        </div>
      </div>
    </div>
  );
}
