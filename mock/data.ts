export interface DailyData {
  time: number; // UNIX timestamp in seconds
  date?: string; // Keep for other potential uses, but chart uses `time`
  open: number;
  close: number;
  volume: number;
  buy_volume: number;
  sell_volume: number;
  limit_status?: 'up' | 'down' | 'none';
}

export interface CurrentDataPoint {
  time: string;
  price: number;
  limit_status: 'up' | 'down' | 'none';
  buy_volume: number;
  sell_volume: number;
}

export interface CurrentData {
  open: number;
  data: CurrentDataPoint[];
}

export interface Order {
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
}

export interface Trade {
  timestamp: number;
  price: number;
  quantity: number;
  type: 'buy' | 'sell';
}

export interface ProjectData {
  id: string;
  historical: DailyData[];
  current: CurrentData;
  orderbook: Order[];
  trades: Trade[];
}

const generateRandomData = (id: string): ProjectData => {
  const historical: DailyData[] = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const open = Math.random() * 100 + 100;
    const close = Math.random() * 100 + 100;
    const buy_volume = Math.floor(Math.random() * 10000);
    const sell_volume = Math.floor(Math.random() * 10000);
    
    historical.push({
      time: Math.floor(date.getTime() / 1000),
      date: date.toISOString().split('T')[0],
      open,
      close,
      volume: buy_volume + sell_volume,
      buy_volume,
      sell_volume,
      limit_status: ['up', 'down', 'none'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'none',
    });
  }

  const current: CurrentData = {
    open: historical[historical.length - 1].close,
    data: [],
  };

  // 为当前数据添加一些初始点
  const basePrice = current.open;
  for (let i = 0; i < 10; i++) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - (10 - i));
    current.data.push({
      time: now.toTimeString().slice(0, 8),
      price: basePrice + (Math.random() - 0.5) * 5,
      limit_status: ['up', 'down', 'none'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'none',
      buy_volume: Math.floor(Math.random() * 1000),
      sell_volume: Math.floor(Math.random() * 1000),
    });
  }

  const orderbook: Order[] = [];
  const orderbookBasePrice = current.open;
  for (let i = 0; i < 14; i++) {
    orderbook.push({
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      quantity: Math.floor(Math.random() * 100) + 1,
      price: orderbookBasePrice + (Math.random() - 0.5) * 20, // 价格围绕开盘价波动
    });
  }

  const trades: Trade[] = [];
  const tradingBasePrice = current.open;
  for (let i = 0; i < 14; i++) {
    trades.push({
      timestamp: Date.now() - Math.floor(Math.random() * 100000),
      // Price is based on the current open price with some variance
      price: tradingBasePrice + (Math.random() - 0.5) * 10,
      quantity: Math.floor(Math.random() * 50),
      type: Math.random() > 0.5 ? "buy" : "sell",
    });
  }

  return {
    id,
    historical,
    current,
    orderbook,
    trades,
  };
};

export const mockData: ProjectData[] = [
  generateRandomData('1'),
  generateRandomData('2'),
];
