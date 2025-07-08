

"use client";

import { useState, useEffect } from "react";
import { fetchTradeSummary } from "@/lib/api";

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'cd9cb95d-f76b-4b1a-af14-ec26aef84772';

interface TradeHeaderProps {
  latestPrice?: number | null;
  priceChangeRate?: number | null;
}

export default function TradeHeader({
  latestPrice: initialLatestPrice,
  priceChangeRate: initialPriceChangeRate,
}: TradeHeaderProps) {
  const [latestPrice, setLatestPrice] = useState(initialLatestPrice);
  const [priceChangeRate, setPriceChangeRate] = useState(initialPriceChangeRate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchTradeSummary(PROJECT_ID, 1);
        const summary = response.trade_summary?.[0];
        if (summary) {
          setLatestPrice(parseFloat(summary.latest_trade_price));
          setPriceChangeRate(parseFloat(summary.price_change_rate));
        }
      } catch (error) {
        console.error("Failed to fetch trade summary:", error);
      }
    };

    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const priceChange = priceChangeRate || 0;
  const priceColor = priceChange >= 0 ? "text-red-600" : "text-green-600";

  return (
    <div className="h-full w-full bg-gray-100 rounded-xl grid grid-cols-2">
      <div className="flex flex-col items-center justify-center">
        <p className="text-gray-600 text-sm">最新成交价</p>
        <p className={`font-semibold ${priceColor}`}>
          ¥ {latestPrice ? latestPrice.toFixed(2) : "0.00"}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <p className="text-gray-600 text-sm">24h涨跌幅</p>
        <p className={`font-semibold ${priceColor}`}>
          {priceChange.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
