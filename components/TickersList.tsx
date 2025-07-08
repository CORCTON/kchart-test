"use client";

import { useEffect, useState } from "react";
import type { Trade } from "@/mock/data";
import { fetchTradeHistory } from "@/lib/api";
import { transformTradeHistoryToTrades } from "@/lib/transforms";

interface TickersListProps {
  initialData: Trade[];
}

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'cd9cb95d-f76b-4b1a-af14-ec26aef84772';

export default function TickersList({ initialData }: TickersListProps) {
  const [trades, setTrades] = useState<Trade[]>(
    initialData.sort((a, b) => b.timestamp - a.timestamp),
  );

  useEffect(() => {
    const fetchTradesData = async () => {
      try {
        const response = await fetchTradeHistory(PROJECT_ID, 1);
        const tradesData = transformTradeHistoryToTrades(response);
        setTrades(
          tradesData.sort((a: Trade, b: Trade) => b.timestamp - a.timestamp),
        );
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      }
    };

    // 每2秒更新一次交易数据
    const interval = setInterval(fetchTradesData, 2000);
    return () => clearInterval(interval);
  }, []);

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
        className="mt-3 space-y-2 overflow-y-auto"
        style={{ height: "calc(100%)" }}
      >
        {trades.slice(0, 15).map((trade, index) => {
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
