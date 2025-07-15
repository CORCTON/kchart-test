export interface ChartData {
	time: number; // 毫秒时间戳
	date?: string;
	open: number;
	close: number;
	volume: number;
	buy_volume: number;
	sell_volume: number;
	limit_status?: "up" | "down" | "none";
}

export interface CurrentDataPoint {
	time: string;
	price: number;
	limit_status: "up" | "down" | "none";
	buy_volume: number;
	sell_volume: number;
}

export interface CurrentData {
	open: number;
	data: CurrentDataPoint[];
}

export interface Order {
	type: "buy" | "sell";
	quantity: number;
	price: number;
}

export interface Trade {
	timestamp: number;
	price: number;
	quantity: number;
	type: "buy" | "sell";
}

export interface ProjectData {
	id: string;
	historical: ChartData[];
	current: CurrentData;
	orderbook: Order[];
	trades: Trade[];
}
