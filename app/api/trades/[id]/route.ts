import { NextResponse } from 'next/server';
import { mockData, type Trade } from '@/mock/data';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id: projectId } = await params;
  const projectData = mockData.find((p) => p.id === projectId);

  if (!projectData) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Simulate a new trade
  if (Math.random() > 0.3) {
    const newTrade: Trade = {
      timestamp: Date.now(),
      price: projectData.current.data[projectData.current.data.length - 1].price,
      quantity: Math.floor(Math.random() * 50) + 1,
      type: Math.random() > 0.5 ? 'buy' : 'sell',
    };
    projectData.trades.unshift(newTrade);
  }

  // Keep the trades array from growing too large
  if (projectData.trades.length > 50) {
    projectData.trades.pop();
  }

  return NextResponse.json(projectData.trades);
}
