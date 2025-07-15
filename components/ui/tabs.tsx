"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TabItem {
	value: string;
	label: string;
	content: React.ReactNode;
}

interface UnderlineTabProps {
	tabs: TabItem[];
	defaultValue?: string;
	className?: string;
	tabListClassName?: string;
	tabContentClassName?: string;
}

export default function Tabs({
	tabs,
	defaultValue,
	className,
	tabListClassName,
	tabContentClassName,
}: UnderlineTabProps) {
	const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);
	const [underlineStyle, setUnderlineStyle] = useState({
		width: 0,
		left: 0,
	});
	const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

	useEffect(() => {
		const activeTabElement = tabRefs.current[activeTab];
		if (activeTabElement) {
			const { offsetWidth, offsetLeft } = activeTabElement;
			setUnderlineStyle({
				width: offsetWidth,
				left: offsetLeft,
			});
		}
	}, [activeTab]);

	const handleTabClick = (value: string) => {
		setActiveTab(value);
	};

	const activeTabContent = tabs.find((tab) => tab.value === activeTab)?.content;

	return (
		<div className={cn("w-full h-full flex flex-col", className)}>
			{/* Tab List */}
			<div className={cn("relative flex-shrink-0", tabListClassName)}>
				<div className="flex space-x-0">
					{tabs.map((tab) => (
						<button
							key={tab.value}
							type="button"
							ref={(el) => {
								tabRefs.current[tab.value] = el;
							}}
							onClick={() => handleTabClick(tab.value)}
							className={cn(
								"relative pr-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none",
								activeTab === tab.value ? "text-black" : "text-gray-500",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Animated Underline */}
				<div
					className="absolute bottom-0 h-0.5 bg-black transition-all duration-300 ease-out"
					style={{
						width: underlineStyle.width * 0.5,
						left: underlineStyle.left + (underlineStyle.width / 2) * 0.25,
					}}
				/>
			</div>

			{/* Tab Content */}
			<div className={cn("pt-4 flex-1 overflow-hidden", tabContentClassName)}>
				{activeTabContent}
			</div>
		</div>
	);
}
