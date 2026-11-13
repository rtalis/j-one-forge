// Aviso (canto inferior direito) de troca para o servidor reserva da API.
// O cliente HTTP chama `avisarFailover` em cada etapa e o MESMO toast (id
// fixo) muda de estado:
// - "tentando": o servidor em uso falhou; brilho (shimmer) enquanto o próximo
//   endereço é testado. Fica aberto até a tentativa terminar.
// - "usando":   o reserva respondeu; as próximas chamadas vão para ele.
// - "falhou":   nenhum respondeu; o aviso some (o erro da própria tela aparece).
import { toast } from "sonner";
import { ArrowRightLeft, ServerCrash } from "lucide-react";

/** Classe CSS do brilho (só o reflexo, sem mudar o fundo); ver styles.css. */
const CLASSE_SHIMMER = "animate-shimmer";
const ID_TOAST = "api-failover";

export type EventoFailover = {
  fase: "tentando" | "usando" | "falhou";
  /** Endereço que falhou. */
  de: string;
  /** Endereço tentado / em uso agora. */
  para: string;
  /** Por que o anterior foi abandonado ("HTTP 503", "sem resposta"...). */
  motivo: string;
};

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function AvisoFailover({ fase, de, para, motivo }: EventoFailover) {
  const tentando = fase === "tentando";
  const Icone = tentando ? ServerCrash : ArrowRightLeft;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${tentando ? CLASSE_SHIMMER : ""} flex w-[356px] max-w-[calc(100vw-2rem)] gap-3 rounded-lg border border-destructive/40 bg-card p-4 text-sm text-foreground shadow-lg`}
    >
      <Icone
        className={`mt-0.5 h-4 w-4 shrink-0 ${tentando ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {tentando ? "Falha no servidor da API" : "Usando o servidor reserva"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {tentando ? (
            <>
              {host(de)} ({motivo}). Tentando {host(para)}...
            </>
          ) : (
            <>
              {host(de)} falhou ({motivo}). As próximas chamadas vão para {host(para)} até
              recarregar a página.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Mostra/atualiza o aviso de failover. Chamado pelo cliente da API. */
export function avisarFailover(evento: EventoFailover) {
  if (typeof window === "undefined") return;
  if (evento.fase === "falhou") {
    toast.dismiss(ID_TOAST);
    return;
  }
  toast.custom(() => <AvisoFailover {...evento} />, {
    id: ID_TOAST,
    duration: evento.fase === "tentando" ? Infinity : 8_000,
    unstyled: true,
  });
}
