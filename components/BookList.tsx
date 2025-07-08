'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Order } from '@/mock/data';
import { fetchOrderBook } from '@/lib/api';
import { transformOrderBookToOrders } from '@/lib/transforms';

interface BookListProps {
  initialData: Order[];
  projectId: string;
}

export default function BookList({ initialData, projectId }: BookListProps) {
  const [orderbook, setOrderbook] = useState<Order[]>(initialData);
  const [visibleCount, setVisibleCount] = useState(10); // 控制可见的订单数量
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 获取并设置订单簿数据
  useEffect(() => {
    const fetchOrderbookData = async () => {
      if (!projectId) return;
      try {
        const response = await fetchOrderBook(projectId);
        const orders = transformOrderBookToOrders(response);
        setOrderbook(orders);
      } catch (error) {
        console.error('Failed to fetch orderbook:', error);
      }
    };

    fetchOrderbookData(); // 初始加载
  }, [projectId]);

  // 处理滚动事件，实现无限加载
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 当滚动到底部附近时加载更多
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setVisibleCount(prevCount => prevCount + 10); // 每次多显示10条
      }
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // 分离买单和卖单，并按价格排序
  const buyOrders = orderbook
    .filter(order => order.type === 'buy')
    .sort((a, b) => b.price - a.price) // 买单按价格从高到低排序
    .slice(0, visibleCount);
  
  const sellOrders = orderbook
    .filter(order => order.type === 'sell')
    .sort((a, b) => a.price - b.price) // 卖单按价格从低到高排序
    .slice(0, visibleCount);

  const totalBuyVolume = buyOrders.reduce((sum, order) => sum + order.quantity, 0);
  const totalSellVolume = sellOrders.reduce((sum, order) => sum + order.quantity, 0);
  const totalVolume = totalBuyVolume + totalSellVolume;
  
  const buyPercentage = totalVolume > 0 ? (totalBuyVolume / totalVolume * 100) : 50;
  const sellPercentage = totalVolume > 0 ? (totalSellVolume / totalVolume * 100) : 50;

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden flex flex-col">
      {/* 买卖比例显示 */}
      <div className="mb-6 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-red-600">{buyPercentage.toFixed(1)}%</span>
        <div className="flex-1 h-4 rounded-sm overflow-hidden flex">
        <div 
          className="bg-red-500 h-full"
          style={{ width: `${buyPercentage}%` }}
        />
        <div 
          className="bg-green-500 h-full"
          style={{ width: `${sellPercentage}%` }}
        />
        </div>
        <span className="text-sm font-medium text-green-600">{sellPercentage.toFixed(1)}%</span>
      </div>
      </div>

      {/* 订单簿表格 */}
      <div className="flex-1 overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-left text-sm  text-gray-500">买入</div>
          <div className="text-right text-sm  text-gray-500">卖出</div>
        </div>

        {/* 可滚动的订单数据区域 */}
        <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 h-[calc(100%)] overflow-y-auto">
          {/* 买单区域 - 左侧 */}
          <div className="space-y-1">
            {buyOrders.map((order, index) => (
              <div key={`buy-${order.price}-${order.quantity}-${index}`} className="grid grid-cols-2 gap-2 py-1 text-sm">
                <div className="text-left text-gray-700">{order.quantity}</div>
                <div className="text-right font-medium text-red-600">
                  {order.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* 卖单区域 - 右侧 */}
          <div className="space-y-1">
            {sellOrders.map((order, index) => (
              <div key={`sell-${order.price}-${order.quantity}-${index}`} className="grid grid-cols-2 gap-2 py-1 text-sm">
                <div className="text-right font-medium text-green-600">
                  {order.price.toFixed(2)}
                </div>
                <div className="text-right text-gray-700">{order.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
