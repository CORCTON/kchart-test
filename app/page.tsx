import TradeHeader from "@/components/TradeHeader";
import TradeKCharts from "@/components/TradeKCharts";
import BookList from "@/components/BookList";
import TickersList from "@/components/TickersList";
import Tabs from "@/components/ui/tabs";
import {
  fetchOrderBook,
  fetchTradeHistory,
  fetchTradeSummary,
} from "@/lib/api";
import {
  transformOrderBookToOrders,
  transformTradeHistoryToTrades,
  transformTradeSummaryToDaily,
} from "@/lib/transforms";

// Fetch data on the server for SSR
async function getCandleData(projectId: string) {
  try {
    // Fetch daily summary data and transform it for the K-chart
    const tradeSummaryResponse = await fetchTradeSummary(projectId, 14); // Fetch last 14 days
    return transformTradeSummaryToDaily(tradeSummaryResponse);
  } catch (error) {
    console.error("Failed to fetch candle data:", error);
    return [];
  }
}

async function getOrderbookData(projectId: string) {
  try {
    const response = await fetchOrderBook(projectId);
    return transformOrderBookToOrders(response);
  } catch (error) {
    console.error("Failed to fetch orderbook data:", error);
    return [];
  }
}

async function getTradesData(projectId: string) {
  try {
    const response = await fetchTradeHistory(projectId, 1);
    // No need to log here again as it's logged in getCandleData
    return transformTradeHistoryToTrades(response);
  } catch (error) {
    console.error("Failed to fetch trades data:", error);
    return [];
  }
}

async function getTradeSummaryData(projectId: string) {
  try {
    const response = await fetchTradeSummary(projectId, 1); // Fetch 1-day summary
    if (!response.trade_summary || response.trade_summary.length === 0) {
      return null;
    }
    const summary = response.trade_summary[0];
    return summary
      ? {
        latestPrice: parseFloat(summary.latest_trade_price),
        priceChangeRate: parseFloat(summary.price_change_rate),
      }
      : null;
  } catch (error) {
    console.error("Failed to fetch trade summary:", error);
    return null;
  }
}

export default async function Home(
  { searchParams }: { searchParams: Promise<{ projectId?: string }> },
) {
  const projectId = (await searchParams).projectId;

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center">
        未找到项目 ID
      </div>
    );
  }

  const [
    candleData,
    orderbookData,
    tradesData,
    summaryData,
  ] = await Promise.all([
    getCandleData(projectId),
    getOrderbookData(projectId),
    getTradesData(projectId),
    getTradeSummaryData(projectId),
  ]);

  if (!summaryData) {
    return (
      <div className="flex h-screen items-center justify-center">
        未找到项目 ID
      </div>
    );
  }

  const tabData = [
    {
      value: "book",
      label: "订单簿",
      content: <BookList initialData={orderbookData} projectId={projectId} />,
    },
    {
      value: "tickers",
      label: "交易动态",
      content: <TickersList initialData={tradesData} projectId={projectId} />,
    },
  ];

  return (
    <div className="flex h-screen flex-col gap-4">
      {/* 交易统计信息 */}
      <div className="h-[calc((100vh-2rem)*0.12)] w-full">
        <TradeHeader
          latestPrice={summaryData?.latestPrice}
          priceChangeRate={summaryData?.priceChangeRate}
          projectId={projectId}
        />
      </div>
      {/* K线图 */}
      <div className="h-[calc((100vh-2rem)*0.44)] w-full">
        <TradeKCharts initialData={candleData} projectId={projectId} />
      </div>
      {/* 交易动态和订单簿 */}
      <div className="h-[calc((100vh-2rem)*0.44)] w-full">
        <Tabs tabs={tabData} defaultValue="book" className="w-full h-full" />
      </div>
    </div>
  );
}
