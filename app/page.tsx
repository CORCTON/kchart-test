import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
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

export default async function Home({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const { projectId } = await searchParams;

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center">
        请提供项目ID
      </div>
    );
  }

  const queryClient = new QueryClient();

  await Promise.all([
    // For TradeHeader
    queryClient.prefetchQuery({
      queryKey: ["realTimeCandleData", projectId],
      queryFn: () => fetchTradeSummary(projectId, 1),
    }),
    // For TradeKCharts
    queryClient.prefetchQuery({
      queryKey: ["tradeSummary", projectId],
      queryFn: () => fetchTradeSummary(projectId, 14),
    }),
    // For BookList
    queryClient.prefetchQuery({
      queryKey: ["orderBook", projectId],
      queryFn: () => fetchOrderBook(projectId),
    }),
    // For TickersList
    queryClient.prefetchQuery({
      queryKey: ["tradeHistory", projectId],
      queryFn: () => fetchTradeHistory(projectId, 1),
    }),
  ]);

  const tabData = [
    {
      value: "book",
      label: "订单簿",
      content: <BookList projectId={projectId} />,
    },
    {
      value: "tickers",
      label: "交易动态",
      content: <TickersList projectId={projectId} />,
    },
  ];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-screen flex-col gap-4">
        {/* 交易统计信息 */}
        <div className="h-[calc((100vh-2rem)*0.12)] w-full">
          <TradeHeader projectId={projectId} />
        </div>
        {/* K线图 */}
        <div className="h-[calc((100vh-2rem)*0.44)] w-full">
          <TradeKCharts projectId={projectId} />
        </div>
        {/* 交易动态和订单簿 */}
        <div className="h-[calc((100vh-2rem)*0.44)] w-full">
          <Tabs tabs={tabData} defaultValue="book" className="w-full h-full" />
        </div>
      </div>
    </HydrationBoundary>
  );
}
