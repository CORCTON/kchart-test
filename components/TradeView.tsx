"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTradeSummary, type TradeSummaryData } from "@/lib/api";
import TradeHeader from "@/components/TradeHeader";
import TradeKCharts from "@/components/TradeKCharts";

interface TradeViewProps {
	projectId: string;
	initialTradeSummary: TradeSummaryData;
}

export default function TradeView({
	projectId,
	initialTradeSummary,
}: TradeViewProps) {
	const { data: realTimeData } = useSuspenseQuery({
		queryKey: ["realTimeCandleData", projectId],
		queryFn: () => fetchTradeSummary(projectId, 1),
		refetchInterval: 5000,
	});

	const chartData = useMemo(() => {
		const initialData = initialTradeSummary.trade_summary || [];
		const latestData = realTimeData.trade_summary?.[0];

		if (!latestData) {
			return initialTradeSummary;
		}

		const updatedData = [...initialData];
		const lastDay = updatedData[updatedData.length - 1];

		if (lastDay && lastDay.date === latestData.date) {
			// Update the last day's data with the real-time data
			updatedData[updatedData.length - 1] = latestData;
		} else if (lastDay && new Date(latestData.date) > new Date(lastDay.date)) {
			// If it's a new day, append the new data
			updatedData.push(latestData);
		}

		return { trade_summary: updatedData };
	}, [initialTradeSummary, realTimeData]);

	return (
		<>
			<div className="h-[calc((100vh-2rem)*0.12)] w-full">
				<TradeHeader tradeSummary={realTimeData} />
			</div>
			<div className="h-[calc((100vh-2rem)*0.44)] w-full">
				<TradeKCharts tradeSummary={chartData} />
			</div>
		</>
	);
}
