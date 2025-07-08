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
  const [isRealTimeActive, setIsRealTimeActive] = useState(true); // 实时请求状态
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // 实时获取最新的交易数据
  const fetchLatestTrades = useCallback(async () => {
    if (!projectId || loading) return;
    try {
      const response = await fetchTradeHistory(projectId, 1);
      const newTrades = transformTradeHistoryToTrades(response);
      if (newTrades.length > 0) {
        setTrades(prevTrades => {
          // 找到最新的时间戳
          const latestTimestamp = prevTrades.length > 0 ? prevTrades[0].timestamp : 0;
          // 只添加比当前最新时间戳更新的交易
          const newerTrades = newTrades.filter(t => t.timestamp > latestTimestamp);
          if (newerTrades.length > 0) {
            return [...newerTrades, ...prevTrades].sort((a, b) => b.timestamp - a.timestamp);
          }
          return prevTrades;
        });
      }
    } catch (error) {
      console.error("Failed to fetch latest trades:", error);
    }
  }, [projectId, loading]);

  // 检查是否滚动到顶部
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop } = container;
      const isAtTop = scrollTop <= 10; // 允许10px的误差
      
      if (isAtTop && !isRealTimeActive) {
        // 如果滚动到顶部，重置为第一页并开始实时请求
        setTrades(prevTrades => prevTrades.slice(0, 20)); // 保留前20条记录
        setPage(2);
        setHasMore(true);
        setIsRealTimeActive(true);
      } else if (!isAtTop && isRealTimeActive) {
        // 如果不在顶部，停止实时请求
        setIsRealTimeActive(false);
      }
    }
  }, [isRealTimeActive]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // 检查滚动位置并处理实时请求
      checkScrollPosition();
      
      // 滚动到底部时加载更多数据
      if (scrollTop + clientHeight >= scrollHeight - 20 && !loading && !isRealTimeActive) {
        fetchTradesData(page);
      }
    }
  }, [loading, page, fetchTradesData, checkScrollPosition, isRealTimeActive]);

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

  // 实时请求数据的 useEffect
  useEffect(() => {
    if (isRealTimeActive && projectId) {
      // 立即执行一次
      fetchLatestTrades();
      
      // 设置定时器，每3秒请求一次最新数据
      realTimeIntervalRef.current = setInterval(() => {
        fetchLatestTrades();
      }, 3000);
    } else {
      // 清除定时器
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
        realTimeIntervalRef.current = null;
      }
    }

    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
        realTimeIntervalRef.current = null;
      }
    };
  }, [isRealTimeActive, projectId, fetchLatestTrades]);

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
        className="mt-3 space-y-2 overflow-y-auto no-scrollbar"
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
