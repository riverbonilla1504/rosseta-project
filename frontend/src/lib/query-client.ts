"use client";

/**
 * Estado del servidor en el cliente con TanStack Query (research R-13 de la feature 003,
 * ROS-174). Un QueryClient por montaje del área privada, es decir, por pestaña: las pestañas
 * no comparten memoria y no mezclan datos (FR-009). Las mutaciones nunca se reintentan solas
 * (una operación interrumpida no se aplica a medias, como apiFetch).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api/client";

const MAX_QUERY_RETRIES = 2;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Solo lo recuperable (503); un 401 ya navegó al acceso y un 404 es definitivo.
        retry: (failureCount, error) =>
          error instanceof ApiError && error.retryable && failureCount < MAX_QUERY_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return createElement(QueryClientProvider, { client }, children);
}
