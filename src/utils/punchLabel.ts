import type { PunchResponse, PunchSlot } from "../types/api";
import { formatBusinessDateTime } from "./timezone";

/**
 * Rotulo de cada uma das quatro marcacoes do dia.
 *
 * Mesma nomenclatura das colunas do painel administrativo: o funcionario ve no
 * terminal o mesmo nome que aparece no relatorio dele.
 */
export const SLOT_LABELS: Record<PunchSlot, string> = {
  entry1: "Entrada 1",
  exit1: "Saida 1",
  entry2: "Entrada 2",
  exit2: "Saida 2",
};

const isPunchSlot = (value: unknown): value is PunchSlot =>
  typeof value === "string" && value in SLOT_LABELS;

/** "07:01:23,123" -> "07:01". Ja vem no fuso de negocio, calculado no servidor. */
const toHourAndMinute = (reportTimeBr?: string) => {
  if (!reportTimeBr) return "";
  const match = /^(\d{2}):(\d{2})/.exec(reportTimeBr);
  return match ? `${match[1]}:${match[2]}` : "";
};

/**
 * Formata o instante bruto da batida.
 *
 * So entra em acao contra servidor antigo, que nao manda `reportDayBr` /
 * `reportTimeBr`. Terminal e servidor sao instalados separadamente, entao essa
 * janela existe — e o resultado precisa sair no fuso de negocio, igual ao
 * caminho principal, e nao no fuso do Windows daquele terminal.
 */
const formatIsoInBusinessTimeZone = (isoDate?: string) => {
  if (!isoDate) return "";

  // Data ilegivel vira ausencia, nao texto cru na tela do funcionario.
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";

  return formatBusinessDateTime(parsed);
};

export type PunchConfirmation = {
  slot: PunchSlot | null;
  /** "Entrada 1". Vazio contra servidor que nao informa a marcacao. */
  label: string;
  /** Linha principal do cartao de sucesso. */
  title: string;
  /** "31/08/2026 as 07:01". Vazio quando nao ha data utilizavel. */
  detail: string;
  /** Frase completa, para onde couber uma linha so. */
  message: string;
};

/**
 * Descreve a batida que acabou de ser registrada.
 *
 * Antes o terminal so dizia "Ponto registrado com sucesso": o funcionario nao
 * sabia se tinha marcado entrada ou saida, e por isso batia de novo por duvida
 * — queimando uma das quatro marcacoes do dia.
 *
 * Prefere sempre `reportDayBr`/`reportTimeBr`, que o servidor ja calcula em
 * America/Sao_Paulo, em vez de reformatar o ISO no fuso da maquina.
 */
export const describePunchConfirmation = (response: PunchResponse): PunchConfirmation => {
  const slot = isPunchSlot(response.punchSlot) ? response.punchSlot : null;
  const label = slot ? SLOT_LABELS[slot] : "";

  const dayBr = response.punch?.reportDayBr ?? "";
  const timeBr = toHourAndMinute(response.punch?.reportTimeBr);

  const detail = dayBr && timeBr
    ? `${dayBr} as ${timeBr}`
    : formatIsoInBusinessTimeZone(response.systemLocalDate);

  // Servidor antigo nao manda `punchSlot`; a frase perde o rotulo mas continua
  // confirmando a batida.
  const title = label ? `${label} registrada` : "Ponto registrado com sucesso";

  return {
    slot,
    label,
    title,
    detail,
    message: detail ? `${title} em ${detail}.` : `${title}.`,
  };
};
