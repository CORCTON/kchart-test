import { NextResponse } from 'next/server';
import { mockData } from '@/mock/data';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id: projectId } = await params;
  const projectData = mockData.find((p) => p.id === projectId);

  if (!projectData) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Return last 29 days of historical data
  const historicalData = projectData.historical.slice(-29);

  return NextResponse.json(historicalData);
}
