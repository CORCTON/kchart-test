export const dynamic = 'force-dynamic'

import TradeHeader from "@/components/TradeHeader";
import TradeKCharts from "@/components/TradeKCharts";
import BookList from "@/components/BookList";
import TickersList from "@/components/TickersList";
import Tabs from "@/components/ui/tabs";
import type { DailyData } from "@/mock/data";

// Fetch data on the server for SSR.
// Note: In a real app, the base URL should come from an environment variable.
async function getInitialData(): Promise<DailyData[]> {
  try {
    const res = await fetch("/api/historical/1", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch initial data");
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return []; 
  }
}

async function getInitialOrderbook() {
  try {
    const res = await fetch("/api/orderbook/1", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch orderbook data");
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getInitialTrades() {
  try {
    const res = await fetch("/api/trades/1", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch trades data");
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function Home() {
  const [initialData, initialOrderbook, initialTrades] = await Promise.all([
    getInitialData(),
    getInitialOrderbook(),
    getInitialTrades(),
  ]);

  const tabData = [
    {
      value: "book",
      label: "订单簿",
      content: <BookList initialData={initialOrderbook} />,
    },
    {
      value: "tickers",
      label: "交易动态",
      content: <TickersList initialData={initialTrades} />,
    },
  ];

  return (
    <div className="flex h-screen flex-col gap-4">
      {/* 交易统计信息 */}
      <div className="h-[calc((100vh-2rem)*0.12)] w-full">
        <TradeHeader />
      </div>
      {/* K线图 */}
      <div className="h-[calc((100vh-2rem)*0.44)] w-full">
        <TradeKCharts initialData={initialData} />
      </div>
      {/* 交易动态和订单簿 */}
      <div className="h-[calc((100vh-2rem)*0.44)] w-full">
        <Tabs tabs={tabData} defaultValue="book" className="w-full h-full" />
      </div>
    </div>
  );
}
