"use client";

import { useEffect, useState } from "react";
import type { CurrentData } from "@/mock/data";

export default function TradeHeader() {
  const [currentData, setCurrentData] = useState<CurrentData | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    // Assuming a default project ID of "1" for this example
    const eventSource = new EventSource("/api/current/1");

    eventSource.onmessage = (event) => {
      const data: CurrentData = JSON.parse(event.data);
      setCurrentData(data);
      if (data.data.length > 0) {
        setLastPrice(data.data[data.data.length - 1].price);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    // Clean up the event source when the component unmounts
    return () => {
      eventSource.close();
    };
  }, []);

  const priceChangePercent =
    currentData && lastPrice
      ? ((lastPrice - currentData.open) / currentData.open) * 100
      : 0;

  const priceColor =
    priceChangePercent >= 0 ? "text-red-600" : "text-green-600";

  return (
    <div className="h-full w-full bg-gray-100 rounded-xl grid grid-cols-2">
      <div className="flex flex-col items-center justify-center">
        <p className="text-gray-600 text-sm">最新成交价</p>
        <p className={`font-semibold ${priceColor}`}>
          ¥ {lastPrice ? lastPrice.toFixed(2) : "0.00"}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <p className="text-gray-600 text-sm">24h涨跌幅</p>
        <p className={`font-semibold ${priceColor}`}>
          {priceChangePercent.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
