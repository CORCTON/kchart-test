import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import BookList from "@/components/BookList";
import TickersList from "@/components/TickersList";
import Tabs from "@/components/ui/tabs";
import TradeView from "@/components/TradeView";
import {
	fetchOrderBook,
	fetchTradeHistory,
	fetchTradeSummary,
} from "@/lib/api";
import { headers } from "next/headers";

export default async function Home({
	searchParams,
}: {
	searchParams: { projectId?: string };
}) {
	const headerList = await headers();
	const authorization = headerList.get("authorization");
	const { projectId } = searchParams;

	if (!projectId) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<h2 className="text-xl font-semibold">出错了！</h2>
				<p>请提供项目ID。</p>
			</div>
		);
	}

	const queryClient = new QueryClient();

	const [initialTradeSummary] = await Promise.all([
		queryClient.fetchQuery({
			queryKey: ["tradeSummary", projectId],
			queryFn: () => fetchTradeSummary(projectId, 14, authorization || ""),
		}),
		queryClient.prefetchQuery({
			queryKey: ["realTimeCandleData", projectId],
			queryFn: () => fetchTradeSummary(projectId, 1, authorization || ""),
		}),
		queryClient.prefetchQuery({
			queryKey: ["orderBook", projectId],
			queryFn: () => fetchOrderBook(projectId, authorization || ""),
		}),
		queryClient.prefetchQuery({
			queryKey: ["tradeHistory", projectId],
			queryFn: () => fetchTradeHistory(projectId, 1, authorization || ""),
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
				<TradeView
					projectId={projectId}
					initialTradeSummary={initialTradeSummary}
				/>
				{/* 交易动态和订单簿 */}
				<div className="h-[calc((100vh-2rem)*0.44)] w-full">
					<Tabs tabs={tabData} defaultValue="book" className="w-full h-full" />
				</div>
			</div>
		</HydrationBoundary>
	);
}
