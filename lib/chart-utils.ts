import type { Time } from "lightweight-charts";
import type { ChartData } from "@/types/trade";

export const formatChartData = (data: ChartData[]) =>
	data.map((d) => ({
		time: d.time as Time,
		value: d.close,
	}));

export const formatVolumeData = (data: ChartData[], factor: number) => {
	const totalVolumeData = data.map((d) => ({
		time: d.time as Time,
		value: (d.buy_volume + d.sell_volume) / factor,
		color: "#ef4444",
	}));

	const sellVolumeData = data.map((d) => ({
		time: d.time as Time,
		value: d.sell_volume / factor,
		color: "#22c55e",
	}));

	return { totalVolumeData, sellVolumeData };
};
