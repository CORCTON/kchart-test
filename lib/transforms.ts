import type { DailyData } from '@/mock/data';
import type { TradeSummaryData, TradeHistoryData, OrderBookData } from '@/lib/api';

// Transform API trade summary data to DailyData format
export function transformTradeSummaryToDaily(response: TradeSummaryData): DailyData[] {
  if (!response.trade_summary) {
    return [];
  }

  const validData = response.trade_summary
    .map((item) => {
      const date = new Date(item.date);
      const timestamp = date.getTime();

      if (Number.isNaN(timestamp)) {
        return null;
      }

      const closePrice = parseFloat(item.close_price) || 0;
      const latestPrice = parseFloat(item.latest_trade_price) || 0;
      const buyAmount = parseInt(item.buy_amount) || 0;
      const sellAmount = parseInt(item.sell_amount) || 0;

      return {
        time: Math.floor(timestamp / 1000),
        date: date.toISOString().split("T")[0],
        open: closePrice,
        close: latestPrice || closePrice,
        volume: buyAmount + sellAmount,
        buy_volume: buyAmount,
        sell_volume: sellAmount,
        limit_status: calculateLimitStatus(closePrice, latestPrice || closePrice),
      };
    })
    .filter(item => item !== null);

  return validData as DailyData[];
}

// Transform API trade history data to trades format
export function transformTradeHistoryToTrades(response: TradeHistoryData) {
  if (!response.trade_history) {
    return [];
  }

  return response.trade_history.map((trade) => ({
    timestamp: parseInt(trade.trade_time),
    price: parseFloat(trade.price),
    quantity: parseInt(trade.amount),
    type: 'buy' as const, // API doesn't provide type, default to buy
  }));
}

// Transform API order book data to order book format
export function transformOrderBookToOrders(response: OrderBookData) {
  if (!response.buy_orders && !response.sell_orders) {
    return [];
  }

  const buyOrders = (response.buy_orders || []).map((order) => ({
    type: 'buy' as const,
    price: parseFloat(order.price),
    quantity: parseInt(order.amount),
  }));

  const sellOrders = (response.sell_orders || []).map((order) => ({
    type: 'sell' as const,
    price: parseFloat(order.price),
    quantity: parseInt(order.amount),
  }));

  return [...buyOrders, ...sellOrders];
}

// Helper function to calculate limit status
function calculateLimitStatus(open: number, close: number): 'up' | 'down' | 'none' {
  if (open === 0) {
    return 'none'; // Avoid division by zero
  }
  const changePercent = ((close - open) / open) * 100;
  
  if (changePercent >= 9.95) return 'up';
  if (changePercent <= -9.95) return 'down';
  return 'none';
}

// Get the latest price from trade history
export function getLatestPriceFromTrades(trades: { timestamp: number; price: number; quantity: number; type: 'buy' | 'sell' }[]): number | null {
  if (trades.length === 0) return null;
  
  // Sort by timestamp descending and get the latest trade
  const sortedTrades = trades.sort((a, b) => b.timestamp - a.timestamp);
  return sortedTrades[0]?.price || null;
}
