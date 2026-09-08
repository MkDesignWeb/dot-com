/**
 * Formatacao no fuso de negocio.
 *
 * O servidor define America/Sao_Paulo como fuso de negocio e persiste tudo em
 * UTC (ver dot-com-server/src/utils/time.utils.ts). O terminal so exibe
 * instantes, nunca converte o caminho inverso — por isso aqui ha apenas
 * formatadores, e nao a conversao local -> UTC que o painel precisa ter.
 *
 * Sem isto, o relogio do terminal segue o fuso configurado no Windows daquela
 * maquina: a hora na tela pode nao ser a hora com que a batida e gravada.
 */

export const BUSINESS_TIMEZONE = "America/Sao_Paulo";

/** Instanciar Intl a cada tick seria desperdicio num terminal que roda o dia todo. */
const clockFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const partsFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "07:01:23" */
export const formatBusinessClock = (date: Date) => clockFormatter.format(date);

/** "segunda-feira, 31 de agosto de 2026" */
export const formatBusinessLongDate = (date: Date) => longDateFormatter.format(date);

/**
 * "31/08/2026 as 07:01".
 *
 * Mesmo formato que `describePunchConfirmation` monta a partir de
 * `reportDayBr`/`reportTimeBr`, para que os dois caminhos produzam a mesma
 * frase.
 */
export const formatBusinessDateTime = (date: Date) => {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} as ${get("hour")}:${get("minute")}`;
};
