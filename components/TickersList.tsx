"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Trade } from "@/mock/data";
import { fetchTradeHistory } from "@/lib/api";
import { transformTradeHistoryToTrades } from "@/lib/transforms";

interface TickersListProps {
  initialData: Trade[];
  projectId: string;
}

export default function TickersList({ initialData, projectId }: TickersListProps) {
  const [trades, setTrades] = useState<Trade[]>(
    initialData.sort((a, b) => b.timestamp - a.timestamp),
  );
  const [page, setPage] = useState(2); // 初始数据是第一页，所以从第二页开始加载
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchTradesData = useCallback(async (pageNum: number) => {
    if (loading || !hasMore || pageNum > 5 || !projectId) return; // 最多请求5页
    setLoading(true);
    try {
      const response = await fetchTradeHistory(projectId, pageNum);
      const newTrades = transformTradeHistoryToTrades(response);
      if (newTrades.length > 0) {
        setTrades(prevTrades => {
          // 合并并去重，防止重复数据
          const existingTimestamps = new Set(prevTrades.map(t => t.timestamp));
          const uniqueNewTrades = newTrades.filter(t => !existingTimestamps.has(t.timestamp));
          return [...prevTrades, ...uniqueNewTrades].sort((a, b) => b.timestamp - a.timestamp);
        });
        setPage(pageNum + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, projectId]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 20 && !loading) {
        fetchTradesData(page);
      }
    }
  }, [loading, page, fetchTradesData]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden">
      {/* 表头 */}
      <div className="grid grid-cols-3 gap-4  text-sm text-gray-500">
        <div className="text-left">时间</div>
        <div className="text-center">价格</div>
        <div className="text-right">数量</div>
      </div>

      {/* 交易列表 */}
      <div
        ref={scrollContainerRef}
        className="mt-3 space-y-2 overflow-y-auto"
        style={{ height: "calc(100%)" }}
      >
        {trades.map((trade, index) => {
          return (
            <div
              key={`trade-${trade.timestamp}-${index}`}
              className={`grid grid-cols-3 gap-4 py-2 text-sm transition-colors duration-300
              }`}
            >
              <div className="text-left text-gray-600">
                {formatTime(trade.timestamp)}
              </div>
              <div
                className={`text-center font-medium ${
                  trade.type === "buy" ? "text-red-600" : "text-green-600"
                }`}
              >
                {trade.price.toFixed(2)}
              </div>
              <div className="text-right text-gray-700">
                {trade.quantity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
