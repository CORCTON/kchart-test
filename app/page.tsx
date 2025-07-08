export const dynamic = 'force-dynamic'

import TradeHeader from "@/components/TradeHeader";
import TradeKCharts from "@/components/TradeKCharts";
import BookList from "@/components/BookList";
import TickersList from "@/components/TickersList";
import Tabs from "@/components/ui/tabs";
import { fetchTradeSummary, fetchOrderBook, fetchTradeHistory } from "@/lib/api";
import { transformOrderBookToOrders, transformTradeHistoryToTrades, transformTradeSummaryToDaily } from "@/lib/transforms";

// Fetch data on the server for SSR
const PROJECT_ID = process.env.PROJECT_ID || 'cd9cb95d-f76b-4b1a-af14-ec26aef84772';

async function getCandleData() {
  try {
    // Fetch daily summary data and transform it for the K-chart
    const tradeSummaryResponse = await fetchTradeSummary(PROJECT_ID, 14); // Fetch last 14 days
    return transformTradeSummaryToDaily(tradeSummaryResponse);
  } catch (error) {
    console.error('Failed to fetch candle data:', error);
    return [];
  }
}

async function getOrderbookData() {
  try {
    const response = await fetchOrderBook(PROJECT_ID);
    return transformOrderBookToOrders(response);
  } catch (error) {
    console.error('Failed to fetch orderbook data:', error);
    return [];
  }
}

async function getTradesData() {
  try {
    const response = await fetchTradeHistory(PROJECT_ID, 1);
    // No need to log here again as it's logged in getCandleData
    return transformTradeHistoryToTrades(response);
  } catch (error) {
    console.error('Failed to fetch trades data:', error);
    return [];
  }
}

async function getTradeSummaryData() {
    try {
        const response = await fetchTradeSummary(PROJECT_ID, 1); // Fetch 1-day summary
        const summary = response.trade_summary?.[0];
        return summary ? {
            latestPrice: parseFloat(summary.latest_trade_price),
            priceChangeRate: parseFloat(summary.price_change_rate),
        } : null;
    } catch (error) {
        console.error('Failed to fetch trade summary:', error);
        return null;
    }
}

export default async function Home() {
  const [
    candleData,
    orderbookData,
    tradesData,
    summaryData
  ] = await Promise.all([
    getCandleData(),
    getOrderbookData(),
    getTradesData(),
    getTradeSummaryData(),
  ]);

  const tabData = [
    {
      value: "book",
      label: "订单簿",
      content: <BookList initialData={orderbookData} />,
    },
    {
      value: "tickers",
      label: "交易动态",
      content: <TickersList initialData={tradesData} />,
    },
  ];

  return (
    <div className="flex h-screen flex-col gap-4">
      {/* 交易统计信息 */}
      <div className="h-[calc((100vh-2rem)*0.12)] w-full">
        <TradeHeader 
          latestPrice={summaryData?.latestPrice}
          priceChangeRate={summaryData?.priceChangeRate}
        />
      </div>
      {/* K线图 */}
      <div className="h-[calc((100vh-2rem)*0.44)] w-full">
        <TradeKCharts initialData={candleData} />
      </div>
      {/* 交易动态和订单簿 */}
      <div className="h-[calc((100vh-2rem)*0.44)] w-full">
        <Tabs tabs={tabData} defaultValue="book" className="w-full h-full" />
      </div>
    </div>
  );
}
