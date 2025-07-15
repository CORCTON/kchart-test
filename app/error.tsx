"use client";

import { useEffect } from "react";

export default function CustomError({
	error,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-4">
			<h2 className="text-xl font-semibold">出错了！</h2>
			<p>获取项目数据失败，请检查项目ID或网络连接。</p>
		</div>
	);
}
