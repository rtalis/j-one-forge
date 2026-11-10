import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getBasepath } from "./lib/basepath";
import { isUnauthorizedError, notifyUnauthorized } from "./lib/auth";
import { toastErro } from "./lib/erro-toast";

/**
 * `meta` aceito por useQuery/useMutation para o toast de erro automático:
 *
 *   useQuery({ queryKey, queryFn, meta: { erro: "Falha ao carregar os pedidos." } })
 *   useMutation({ mutationFn, meta: { erro: false } }) // a tela trata o erro sozinha
 */
type ErroMeta = { erro?: string | false };

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: ErroMeta;
    mutationMeta: ErroMeta;
  }
}

export const getRouter = () => {
  const handleError = (error: unknown, meta: ErroMeta | undefined, padrao: string) => {
    if (isUnauthorizedError(error)) {
      // Sessão expirada: o auth já avisa e volta ao login.
      void queryClient.cancelQueries();
      queryClient.clear();
      notifyUnauthorized();
      return;
    }
    if (meta?.erro === false) return;
    toastErro(meta?.erro ?? padrao, error);
  };

  const queryClient = new QueryClient({
    // Só depois das novas tentativas (retry) falharem: um toast por consulta.
    queryCache: new QueryCache({
      onError: (error, query) =>
        handleError(error, query.meta, "Não foi possível carregar os dados."),
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) =>
        handleError(error, mutation.meta, "Não foi possível salvar as alterações."),
    }),
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
