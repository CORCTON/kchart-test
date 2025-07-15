const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function createHeaders(authorization?: string): HeadersInit {
	const headers: HeadersInit = {
		"Content-Type": "application/json",
	};
	if (authorization) {
		headers.Authorization = authorization;
	}
	return headers;
}

// 通用的 API 响应包装器
interface ApiResponse<T> {
	isSuccess: boolean;
	msg: string;
	data: T;
}

// 特定数据结构类型
export interface OrderBookData {
	buy_orders: Array<{
		order_id: string;
		user_id: string;
		coin_id: string;
		price: string;
		amount: string;
		order_type: number;
		market_type: number;
		order_time: string;
		expiration_time: string;
	}>;
	sell_orders: Array<{
		order_id: string;
		user_id: string;
		coin_id: string;
		price: string;
		amount: string;
		order_type: number;
		market_type: number;
		order_time: string;
		expiration_time: string;
	}>;
}

export interface TradeHistoryData {
	trade_history: Array<{
		trade_time: string;
		price: string;
		amount: string;
	}>;
	total: string;
}

export interface TradeSummaryData {
	trade_summary: Array<{
		date: string;
		close_price: string;
		latest_trade_price: string;
		price_change_rate: string;
		buy_amount: string;
		sell_amount: string;
	}>;
}

// API 客户端函数
// 获取订单簿数据
export async function fetchOrderBook(
	projectId: string,
	authorization?: string,
): Promise<OrderBookData> {
	const response = await fetch(
		`${API_BASE_URL}/v1/nft/match/order-book/${projectId}`,
		{
			headers: createHeaders(authorization),
			next: { revalidate: 60 },
		},
	);
	if (!response.ok) {
		throw new Error(`Failed to fetch order book: ${response.statusText}`);
	}
	const result: ApiResponse<OrderBookData> = await response.json();
	if (!result.isSuccess) {
		throw new Error(`API error fetching order book: ${result.msg}`);
	}
	return result.data;
}

// 获取交易历史数据
export async function fetchTradeHistory(
	projectId: string,
	page: number = 1,
	authorization?: string,
): Promise<TradeHistoryData> {
	const response = await fetch(
		`${API_BASE_URL}/v1/nft/match/trade-history/${projectId}?page=${page}`,
		{
			headers: createHeaders(authorization),
			next: { revalidate: 60 },
		},
	);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch trade history: ${response.statusText}`,
		);
	}
	const result: ApiResponse<TradeHistoryData> = await response.json();
	if (!result.isSuccess) {
		throw new Error(`API error fetching trade history: ${result.msg}`);
	}
	return result.data;
}

// 获取交易汇总数据
export async function fetchTradeSummary(
	projectId: string,
	limitDays: number = 14,
	authorization?: string,
): Promise<TradeSummaryData> {
	const response = await fetch(
		`${API_BASE_URL}/v1/nft/match/trade-summary/${projectId}?limit_days=${limitDays}`,
		{
			headers: createHeaders(authorization),
			next: { revalidate: 3600 },
		},
	);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch trade summary: ${response.statusText}`,
		);
	}
	const result: ApiResponse<TradeSummaryData> = await response.json();
	if (!result.isSuccess) {
		throw new Error(`API error fetching trade summary: ${result.msg}`);
	}
	return result.data;
}

// 获取当前价格
export async function fetchCurrentPrice(
	projectId: string,
	authorization?: string,
): Promise<{ price: number; timestamp: number }> {
	const response = await fetchTradeHistory(projectId, 1, authorization);
	const trades = response.trade_history;

	if (trades && trades.length > 0) {
		const latestTrade = trades[trades.length - 1];
		return {
			price: parseFloat(latestTrade.price),
			timestamp: parseInt(latestTrade.trade_time),
		};
	}

	throw new Error("No current price data available");
}

// 获取最新交易数据
export async function fetchLatestTradingData(
	projectId: string,
	authorization?: string,
) {
	const [tradeHistory, orderBook] = await Promise.all([
		fetchTradeHistory(projectId, 1, authorization),
		fetchOrderBook(projectId, authorization),
	]);

	return {
		tradeHistory,
		orderBook,
	};
}
