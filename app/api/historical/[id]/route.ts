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

  const allHistoricalData = projectData.historical;
  
  // If data is less than 14 days, show all; otherwise, show the last 14 days.
  const historicalData =
    allHistoricalData.length <14
      ? allHistoricalData
      : allHistoricalData.slice(-14);

  return NextResponse.json(historicalData);
}
