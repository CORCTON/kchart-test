import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: { id: string } },
) {
	const { id } = params;
	const filePath = path.join(process.cwd(), "mock", `${id}.json`);

	try {
		const fileContent = await fs.readFile(filePath, "utf-8");
		const data = JSON.parse(fileContent);
		const randomIndex = Math.floor(Math.random() * data.currentData.length);
		return NextResponse.json(data.currentData[randomIndex]);
	} catch {
		return NextResponse.json({ error: "Project not found" }, { status: 404 });
	}
}
