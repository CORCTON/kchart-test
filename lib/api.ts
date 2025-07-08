// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sjb.debaox.cn';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZDZlMjBiMy1iZmE3LTQ0ODItODg1ZC0zYzRlN2NiZjQ4YjciLCJleHAiOjE3NTQ1NDg4NjUsImlhdCI6MTc1MTk1Njg2NSwianRpIjoiODYyMmI1ODYtYWZhNS00MTY0LThlNjgtNGU3YWFjZWE2NTY2In0.Z_aRnrOvSrnmOR8KJQiNLqrg66avZmI2wmwu3B0iKwE';

// Helper function to create headers with authorization
export function createHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// Generic API response wrapper
interface ApiResponse<T> {
  isSuccess: boolean;
  msg: string;
  data: T;
}

// Specific data structure types
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

// API client functions
export async function fetchOrderBook(projectId: string): Promise<OrderBookData> {
  const response = await fetch(`${API_BASE_URL}/v1/nft/match/order-book/${projectId}`, {
    headers: createHeaders(),
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch order book: ${response.statusText}`);
  }
  const result: ApiResponse<OrderBookData> = await response.json();
  if (!result.isSuccess) {
    throw new Error(`API error fetching order book: ${result.msg}`);
  }
  return result.data;
}

export async function fetchTradeHistory(projectId: string, page: number = 1): Promise<TradeHistoryData> {
  const response = await fetch(`${API_BASE_URL}/v1/nft/match/trade-history/${projectId}?page=${page}`, {
    headers: createHeaders(),
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch trade history: ${response.statusText}`);
  }
  const result: ApiResponse<TradeHistoryData> = await response.json();
  if (!result.isSuccess) {
    throw new Error(`API error fetching trade history: ${result.msg}`);
  }
  return result.data;
}

export async function fetchTradeSummary(projectId: string, limitDays: number = 14): Promise<TradeSummaryData> {
  const response = await fetch(`${API_BASE_URL}/v1/nft/match/trade-summary/${projectId}?limit_days=${limitDays}`, {
    headers: createHeaders(),
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch trade summary: ${response.statusText}`);
  }
  const result: ApiResponse<TradeSummaryData> = await response.json();
  if (!result.isSuccess) {
    throw new Error(`API error fetching trade summary: ${result.msg}`);
  }
  return result.data;
}

// Additional API functions for real-time updates
export async function fetchCurrentPrice(projectId: string): Promise<{ price: number; timestamp: number }> {
  // Get latest trade from trade history as a proxy for current price
  const response = await fetchTradeHistory(projectId, 1);
  const trades = response.trade_history;
  
  if (trades && trades.length > 0) {
    const latestTrade = trades[trades.length - 1];
    return {
      price: parseFloat(latestTrade.price),
      timestamp: parseInt(latestTrade.trade_time)
    };
  }
  
  throw new Error('No current price data available');
}

// Get latest trading data for real-time updates
export async function fetchLatestTradingData(projectId: string) {
  const [tradeHistory, orderBook] = await Promise.all([
    fetchTradeHistory(projectId, 1),
    fetchOrderBook(projectId)
  ]);
  
  return {
    tradeHistory,
    orderBook
  };
}
