import { type CurrentDataPoint, mockData } from "@/mock/data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id: projectId } = await params;
  const projectDataFromMock = mockData.find((p) => p.id === projectId);

  if (!projectDataFromMock) {
    return new Response("Project not found", { status: 404 });
  }

  // Create a deep copy to avoid shared state between requests
  const projectData = JSON.parse(JSON.stringify(projectDataFromMock));

  if (!projectData) {
    return new Response("Project not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const sendData = () => {
        const now = new Date();
        const currentTime = now.toLocaleTimeString();
        const currentMinute = now.getMinutes();

        const dataArray = projectData.current.data;
        const lastDataPoint = dataArray.length > 0 ? dataArray[dataArray.length - 1] : null;

        // Helper to create a new data point
        const createNewDataPoint = (price: number): CurrentDataPoint => ({
          time: currentTime,
          price: price,
          limit_status:
            price > projectData.current.open * 1.1
              ? "up"
              : price < projectData.current.open * 0.9
              ? "down"
              : "none",
          buy_volume: Math.floor(Math.random() * 10000),
          sell_volume: Math.floor(Math.random() * 10000),
        });

        let lastMinute = -1;
        if (lastDataPoint) {
          // Extract minute from time string like "HH:MM:SS"
          const timeParts = lastDataPoint.time.split(":");
          if (timeParts.length >= 2) {
            lastMinute = parseInt(timeParts[1], 10);
          }
        }
        
        const newPrice = lastDataPoint 
          ? lastDataPoint.price + (Math.random() - 0.5) * 2
          : projectData.current.open + (Math.random() - 0.5) * 2;

        if (!lastDataPoint || currentMinute !== lastMinute) {
          // If no data exists, or if it's a new minute, add a new point
          const newDataPoint = createNewDataPoint(newPrice);
          dataArray.push(newDataPoint);
        } else {
          // Otherwise, update the last data point
          lastDataPoint.time = currentTime;
          lastDataPoint.price = newPrice;
          lastDataPoint.limit_status = createNewDataPoint(newPrice).limit_status; // Recalculate status
          lastDataPoint.buy_volume += Math.floor(Math.random() * 50);
          lastDataPoint.sell_volume += Math.floor(Math.random() * 50);
        }

        // Keep the data array from growing too large
        if (dataArray.length > 100) {
          dataArray.shift();
        }

        controller.enqueue(
          `data: ${JSON.stringify(projectData.current)}\n\n`,
        );
      };

      // Send data every 1 second
      const intervalId = setInterval(sendData, 1000);

      // Clean up when the connection is closed
      _request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
