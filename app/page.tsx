
import TradeHeader from "@/components/TradeHeader";
import TradeKCharts from "@/components/TradeKCharts";
import Tabs from "@/components/ui/tabs";

export default function Home() {
	const tabData = [
		{
			value: "tickers",
			label: "订单簿",
			content: <div>订单簿页面</div>,
		},
		{
			value: "book",
			label: "交易动态",
			content: <div>交易动态页面</div>,
		},
	];

	return (
		<div className="flex min-h-screen flex-col items-center justify-start">
			{/* 交易统计信息 */}
			<TradeHeader />
			{/* K线图 */}
			<TradeKCharts />
			{/* 交易动态和订单簿*/}
			<Tabs tabs={tabData} defaultValue="tickers" className="w-full" />
		</div>
	);
}
