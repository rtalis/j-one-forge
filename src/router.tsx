import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getBasepath } from "./lib/basepath";
import { isUnauthorizedError, notifyUnauthorized } from "./lib/auth";

export const getRouter = () => {
  const handleError = (error: unknown) => {
    if (!isUnauthorizedError(error)) return;
    void queryClient.cancelQueries();
    queryClient.clear();
    notifyUnauthorized();
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => !isUnauthorizedError(error) && failureCount < 2,
      },
      mutations: {
        retry: (failureCount, error) => !isUnauthorizedError(error) && failureCount < 1,
      },
    },
  });

  const basepath = getBasepath();

  const router = createRouter({
    routeTree,
    ...(basepath ? { basepath } : {}),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
