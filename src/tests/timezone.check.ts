import assert from "node:assert/strict";
import {
  BUSINESS_TIMEZONE,
  formatBusinessClock,
  formatBusinessDateTime,
  formatBusinessLongDate,
} from "../utils/timezone";

/**
 * A propriedade que importa: o texto na tela do terminal nao pode depender do
 * fuso configurado no Windows daquela maquina. Todos os casos abaixo partem de
 * um instante UTC fixo e afirmam o horario de America/Sao_Paulo.
 */

// 31/08/2026 10:01:23 UTC = 07:01:23 em Sao Paulo (UTC-3).
const instante = new Date("2026-08-31T10:01:23.000Z");

function run() {
  assert.equal(BUSINESS_TIMEZONE, "America/Sao_Paulo");

  // ---- Relogio ----
  assert.equal(formatBusinessClock(instante), "07:01:23");

  // ---- Data por extenso ----
  const porExtenso = formatBusinessLongDate(instante);
  assert.match(porExtenso, /segunda-feira/);
  assert.match(porExtenso, /31/);
  assert.match(porExtenso, /agosto/);
  assert.match(porExtenso, /2026/);

  // ---- Data + hora ----
  assert.equal(formatBusinessDateTime(instante), "31/08/2026 as 07:01");

  // ---- Virada de dia ----
  // 01/09/2026 02:30 UTC ainda e 31/08 as 23:30 em Sao Paulo. Uma maquina em UTC
  // mostraria o dia seguinte — e o funcionario veria a data errada na tela.
  const viradaUtc = new Date("2026-09-01T02:30:00.000Z");
  assert.equal(formatBusinessDateTime(viradaUtc), "31/08/2026 as 23:30");
  assert.equal(formatBusinessClock(viradaUtc), "23:30:00");
  assert.match(formatBusinessLongDate(viradaUtc), /31 de agosto/);

  // O caminho inverso: 31/08 23:30 UTC ja e 01/09 em Sao Paulo? Nao — e 20:30.
  assert.equal(formatBusinessDateTime(new Date("2026-08-31T23:30:00.000Z")), "31/08/2026 as 20:30");

  // ---- 24 horas, nunca AM/PM ----
  assert.equal(formatBusinessClock(new Date("2026-08-31T20:05:09.000Z")), "17:05:09");
  assert.equal(formatBusinessDateTime(new Date("2026-08-31T03:00:00.000Z")), "31/08/2026 as 00:00");

  // Meia-noite exata em Sao Paulo nao pode virar "24:00".
  const meiaNoite = formatBusinessClock(new Date("2026-08-31T03:00:00.000Z"));
  assert.equal(meiaNoite, "00:00:00");

  // ---- Independencia do relogio da maquina ----
  // Formatar o mesmo instante duas vezes com TZ do processo diferente tem de
  // produzir exatamente o mesmo texto.
  const referencia = formatBusinessDateTime(instante);
  const emOutroFuso = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instante);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    emOutroFuso.find((part) => part.type === type)?.value ?? "";
  assert.equal(referencia, `${get("day")}/${get("month")}/${get("year")} as ${get("hour")}:${get("minute")}`);

  console.log("timezone.check: ok");
}

run();
