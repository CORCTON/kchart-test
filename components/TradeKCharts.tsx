"use client";

import {
  AreaSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineStyle,
  type MouseEventParams,
} from "lightweight-charts";
import { useEffect, useRef, useMemo } from "react";
import { transformTradeSummaryToDaily } from "@/lib/transforms";
import { formatChartData, formatVolumeData } from "@/lib/chart-utils";
import type { ChartData } from "@/types/trade";
import type { TradeSummaryData } from "@/lib/api";

interface TradeKChartsProps {
  tradeSummary: TradeSummaryData;
}

export default function TradeKCharts({ tradeSummary }: TradeKChartsProps) {

  const chartData = useMemo(
    () => transformTradeSummaryToDaily(tradeSummary),
    [tradeSummary],
  );

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const totalVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sellVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const volumeFactorRef = useRef(1);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.offsetHeight,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#9B9B9B",
        attributionLogo: false,
      },
      grid: { vertLines: { color: "#f0f0f0" }, horzLines: { color: "#f0f0f0" } },
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
        tickMarkFormatter: (time: number) =>
          new Date(time * 1000).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
      },
      rightPriceScale: { borderColor: "transparent" },
      leftPriceScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });
    chartRef.current = chart;

    seriesRef.current = chart.addSeries(AreaSeries, {
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

    totalVolumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: "#ef4444",
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    totalVolumeSeriesRef.current
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    sellVolumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: "#22c55e",
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    sellVolumeSeriesRef.current
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.offsetHeight,
        );
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (
      !chartRef.current ||
      !seriesRef.current ||
      !totalVolumeSeriesRef.current ||
      !sellVolumeSeriesRef.current ||
      chartData.length === 0
    ) {
      return;
    }

    const formattedData = formatChartData(chartData);
    const { totalVolumeData, sellVolumeData } = formatVolumeData(
      chartData,
      volumeFactorRef.current,
    );

    seriesRef.current.setData(formattedData);
    totalVolumeSeriesRef.current.setData(totalVolumeData);
    sellVolumeSeriesRef.current.setData(sellVolumeData);
    chartRef.current.timeScale().fitContent();

    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const renderTooltipContent = (dataPoint: ChartData) => {
      const dataIndex = chartData.findIndex((d) => d.time === dataPoint.time);
      const isLastPoint = dataIndex === chartData.length - 1;

      const prevClose =
        dataIndex > 0 ? chartData[dataIndex - 1].close : dataPoint.open;
      const change =
        prevClose === 0 ? 0 : ((dataPoint.close - prevClose) / prevClose) * 100;
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
        !timeEl ||
        !priceLabelEl ||
        !closeEl ||
        !changeEl ||
        !statusContainerEl ||
        !statusEl ||
        !buyVolumeEl ||
        !sellVolumeEl ||
        !totalVolumeEl
      ) {
        return;
      }

      priceLabelEl.innerText = isLastPoint ? "最新价" : "收盘价";
      timeEl.innerText = new Date(dataPoint.time * 1000).toLocaleDateString(
        "zh-CN",
        { year: "numeric", month: "2-digit", day: "2-digit" },
      );
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
      if (
        !param.time ||
        param.point === undefined ||
        !param.seriesData.size ||
        !chartContainerRef.current
      ) {
        tooltip.style.display = "none";
        return;
      }
      const dataPoint = chartData.find((d) => d.time === param.time);
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

    // Set initial tooltip to the last data point
    const lastDataPoint = chartData[chartData.length - 1];
    if (lastDataPoint) {
      renderTooltipContent(lastDataPoint);
      tooltip.style.display = "block";
      // Position tooltip to the right
      if (chartContainerRef.current) {
        const chartWidth = chartContainerRef.current.clientWidth;
        const tooltipWidth = tooltip.offsetWidth;
        tooltip.style.left = `${chartWidth - tooltipWidth - 12}px`;
        tooltip.style.top = "12px";
      }
    }
  }, [chartData]);

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
