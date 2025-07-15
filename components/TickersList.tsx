"use client";

import { useMemo, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchTradeHistory } from "@/lib/api";
import { transformTradeHistoryToTrades } from "@/lib/transforms";

interface TickersListProps {
	projectId: string; // 项目ID
}

export default function TickersList({ projectId }: TickersListProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const { data: tradeHistoryData } = useSuspenseQuery({
		queryKey: ["tradeHistory", projectId],
		queryFn: () => fetchTradeHistory(projectId, 1),
		refetchInterval: 5000,
	});

	const trades = useMemo(
		() =>
			transformTradeHistoryToTrades(tradeHistoryData).sort(
				(a, b) => b.timestamp - a.timestamp,
			),
		[tradeHistoryData],
	);

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("zh-CN", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	return (
		<div className="h-full w-full bg-white rounded-lg overflow-hidden">
			{/* 表头 */}
			<div className="grid grid-cols-3 gap-4  text-sm text-gray-500">
				<div className="text-left">时间</div>
				<div className="text-center">价格</div>
				<div className="text-right">数量</div>
			</div>

			{/* 交易列表 */}
			<div
				ref={scrollContainerRef}
				className="mt-3 space-y-2 overflow-y-auto no-scrollbar"
				style={{ height: "calc(100%)" }}
			>
				{trades.map((trade, index) => {
					return (
						<div
							key={`trade-${trade.timestamp}-${index}`}
							className={`grid grid-cols-3 gap-4 py-2 text-sm transition-colors duration-300
              }`}
						>
							<div className="text-left text-gray-600">
								{formatTime(trade.timestamp)}
							</div>
							<div
								className={`text-center font-medium ${
									trade.type === "buy" ? "text-red-600" : "text-green-600"
								}`}
							>
								{trade.price.toFixed(2)}
							</div>
							<div className="text-right text-gray-700">{trade.quantity}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
