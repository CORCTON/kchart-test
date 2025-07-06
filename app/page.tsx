import TradeHeader from "@/components/TradeHeader";
import TradeKCharts from "@/components/TradeKCharts";
import BookList from "@/components/BookList";
import Tabs from "@/components/ui/tabs";
import TradeVolumn from "@/components/TradeVolumn";
import type { DailyData } from "@/mock/data";

// Fetch data on the server for SSR.
// Note: In a real app, the base URL should come from an environment variable.
async function getInitialData(): Promise<DailyData[]> {
  try {
    const res = await fetch("http://localhost:3000/api/historical/1", {
      cache: "no-store", // Ensure fresh data on each request
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

export default async function Home() {
  const initialData = await getInitialData();

  const tabData = [
    {
      value: "tickers",
      label: "订单簿",
      content: <BookList />,
    },
    {
      value: "book",
      label: "交易动态",
      content: <TradeVolumn />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-start">
      {/* 交易统计信息 */}
      <TradeHeader />
      {/* K线图 */}
      <TradeKCharts initialData={initialData} />
      {/* 交易动态和订单簿*/}
      <Tabs tabs={tabData} defaultValue="tickers" className="w-full" />
    </div>
  );
}
