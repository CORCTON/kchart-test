"use client";
import {
	isServer,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { ReactNode } from "react";

function makeQueryClient() {
	return new QueryClient();
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
	if (isServer) {
		return makeQueryClient();
	}
	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient();
	}
	return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			{children}
		</QueryClientProvider>
	);
}
