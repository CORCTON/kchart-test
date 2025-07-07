import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "数交宝K线图",
	description: "数交宝K线图--使用@tradingview/lightweight-charts",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh">
			<body className="p-0 m-0">
				{children}
			</body>
		</html>
	);
}
