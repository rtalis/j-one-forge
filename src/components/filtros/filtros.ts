import type { Opcao } from "./lista-excel";

export type { Opcao };
/** Valores aceitos por um filtro. Vazio = todos. */
export type Selecao = (string | number)[];

/** Opções distintas de um campo, em ordem alfabética (pt-BR, números em ordem natural). */
export function opcoesDe<T>(linhas: T[], campo: (r: T) => string | number): Opcao[] {
  return [...new Set(linhas.map(campo))]
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { numeric: true }))
    .map((v) => ({ valor: v, rotulo: String(v) || "(vazio)" }));
}

/** true se a linha passa no filtro (seleção vazia = passa tudo). */
export function passa(selecao: Selecao, valor: string | number): boolean {
  return selecao.length === 0 || selecao.includes(valor);
}
