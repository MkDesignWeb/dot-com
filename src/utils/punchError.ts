import { EMPLOYEE_TERMINATED, MAX_PUNCHES_REACHED, type PunchErrorResponse } from "../types/api";

/**
 * Traduz a falha da requisicao no que a tela deve mostrar.
 *
 * Vive fora do hook para poder ser testado: a decisao de qual mensagem aparece
 * no terminal e regra de negocio, nao detalhe de renderizacao.
 */
export type PunchErrorStatus = "error" | "maxPunch" | "inactive";

export type PunchErrorDescription = {
  status: PunchErrorStatus;
  message: string;
};

export const FALLBACK_ERROR_MESSAGE = "Nao foi possivel registrar o ponto.";

const MAX_PUNCHES_MESSAGE = "Limite de 4 marcacoes atingido hoje. Procure o responsavel.";
const TERMINATED_MESSAGE = "Funcionário inativado, contate o supervisor responsável.";

/**
 * Texto exato que o servidor mandava antes de existir `code`.
 * Ponte para terminal apontado a um servidor antigo — o codigo e o caminho novo.
 */
const LEGACY_MAX_PUNCHES_MESSAGE = "Limite de pontos atingido para hoje";

export function describePunchError(
  data: PunchErrorResponse | undefined,
  rawMessage: string
): PunchErrorDescription {
  const message = rawMessage || FALLBACK_ERROR_MESSAGE;

  if (data?.code === EMPLOYEE_TERMINATED) {
    // Mensagem propria, nao a do servidor: e ela que diz o que fazer em
    // seguida — procurar o supervisor, em vez de tentar de novo.
    return { status: "inactive", message: TERMINATED_MESSAGE };
  }

  if (data?.code === MAX_PUNCHES_REACHED || message === LEGACY_MAX_PUNCHES_MESSAGE) {
    return { status: "maxPunch", message: MAX_PUNCHES_MESSAGE };
  }

  return { status: "error", message };
}
