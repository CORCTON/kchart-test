"use client";

import type { TradeSummaryData } from "@/lib/api";

interface TradeHeaderProps {
  tradeSummary: TradeSummaryData;
}

export default function TradeHeader({ tradeSummary }: TradeHeaderProps) {
  const summary = tradeSummary.trade_summary?.[0];
  const latestPrice = summary ? parseFloat(summary.latest_trade_price) : 0;
  const priceChangeRate = summary ? parseFloat(summary.price_change_rate) : 0;
  let priceColor = "text-gray-500";
  switch (true) {
    case priceChangeRate > 0:
      priceColor = "text-red-600";
      break;
    case priceChangeRate < 0:
      priceColor = "text-green-600";
      break;
    default:
      priceColor = "text-gray-500";
      break;
  }

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
          {priceChangeRate ? priceChangeRate.toFixed(2) : "0.00"}%
        </p>
      </div>
    </div>
  );
}
