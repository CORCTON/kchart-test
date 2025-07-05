import { NextResponse } from 'next/server';
import { mockData, type Order } from '@/mock/data';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id: projectId } = await params;
  const projectData = mockData.find((p) => p.id === projectId);

  if (!projectData) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Simulate order book changes
  if (Math.random() > 0.5 && projectData.orderbook.length > 5) {
    projectData.orderbook.shift(); // Remove an old order
  } else {
    const newOrder: Order = {
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      quantity: Math.floor(Math.random() * 100),
      price: projectData.current.data[projectData.current.data.length - 1].price + (Math.random() - 0.5) * 5,
    };
    projectData.orderbook.push(newOrder); // Add a new order
  }

  return NextResponse.json(projectData.orderbook);
}
