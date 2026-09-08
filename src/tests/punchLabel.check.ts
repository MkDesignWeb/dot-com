import assert from "node:assert/strict";
import type { PunchResponse } from "../types/api";
import { SLOT_LABELS, describePunchConfirmation } from "../utils/punchLabel";

/**
 * O terminal so pode afirmar "Entrada 1" com o que o servidor mandou. Estes
 * casos travam as duas pontas do contrato: o caminho novo (com `punchSlot`) e o
 * caminho contra servidor antigo, que nao o envia.
 */

const punch = (overrides: Partial<NonNullable<PunchResponse["punch"]>> = {}) => ({
  id: 1,
  employeeId: 9,
  employeeName: "Jose Elenilson",
  timeStamp: "2026-08-31T10:01:23.000Z",
  displayTimeBr: "31/08/2026, 07:01:23,000 BRT",
  reportDayBr: "31/08/2026",
  reportTimeBr: "07:01:23,000",
  ...overrides,
});

function run() {
  // ---- As quatro marcacoes do dia ----
  const slots = ["entry1", "exit1", "entry2", "exit2"] as const;
  const expectedTitles = [
    "Entrada 1 registrada",
    "Saida 1 registrada",
    "Entrada 2 registrada",
    "Saida 2 registrada",
  ];

  slots.forEach((slot, index) => {
    const result = describePunchConfirmation({ punchSlot: slot, punch: punch() });
    assert.equal(result.slot, slot);
    assert.equal(result.label, SLOT_LABELS[slot]);
    assert.equal(result.title, expectedTitles[index]);
    assert.equal(result.detail, "31/08/2026 as 07:01");
    assert.equal(result.message, `${expectedTitles[index]} em 31/08/2026 as 07:01.`);
  });

  // ---- Fuso ----
  // A batida acima e 10:01 UTC. O texto tem de dizer 07:01, que e o horario de
  // negocio que o servidor calculou — nunca o relogio da maquina do terminal.
  const businessTime = describePunchConfirmation({ punchSlot: "entry1", punch: punch() });
  assert.match(businessTime.detail, /07:01/);
  assert.equal(businessTime.detail.includes("10:01"), false);

  // Segundos e milissegundos saem: para conferir a batida, HH:MM basta.
  assert.equal(
    describePunchConfirmation({ punchSlot: "exit2", punch: punch({ reportTimeBr: "18:06:47,912" }) }).detail,
    "31/08/2026 as 18:06"
  );

  // ---- Servidor antigo: sem `punchSlot` ----
  // A confirmacao perde o rotulo, mas nao pode sumir nem mentir a marcacao.
  const semSlot = describePunchConfirmation({ punch: punch() });
  assert.equal(semSlot.slot, null);
  assert.equal(semSlot.label, "");
  assert.equal(semSlot.title, "Ponto registrado com sucesso");
  assert.equal(semSlot.message, "Ponto registrado com sucesso em 31/08/2026 as 07:01.");

  // Valor inesperado no lugar do slot e tratado como ausente, nao quebra.
  const slotInvalido = describePunchConfirmation({
    punchSlot: "entry3" as never,
    punch: punch(),
  });
  assert.equal(slotInvalido.slot, null);
  assert.equal(slotInvalido.title, "Ponto registrado com sucesso");

  assert.equal(describePunchConfirmation({ punchSlot: null, punch: punch() }).slot, null);

  // ---- Servidor antigo: sem `reportDayBr`/`reportTimeBr` ----
  // Cai no instante bruto, mas continua saindo no fuso de negocio: o texto tem
  // de ser IDENTICO ao do caminho principal para o mesmo instante.
  const semReport = describePunchConfirmation({
    punchSlot: "entry1",
    punch: punch({ reportDayBr: "", reportTimeBr: "" }),
    systemLocalDate: "2026-08-31T10:01:23.000Z",
  });
  assert.equal(semReport.title, "Entrada 1 registrada");
  assert.equal(semReport.detail, "31/08/2026 as 07:01");
  assert.equal(semReport.detail, businessTime.detail);
  assert.equal(semReport.detail.includes("10:01"), false);

  // Virada de dia pelo caminho antigo: 01/09 02:30 UTC ainda e 31/08 em Sao Paulo.
  assert.equal(
    describePunchConfirmation({
      punchSlot: "exit2",
      punch: punch({ reportDayBr: "", reportTimeBr: "" }),
      systemLocalDate: "2026-09-01T02:30:00.000Z",
    }).detail,
    "31/08/2026 as 23:30"
  );

  // ---- Sem data nenhuma: a frase fecha sem " em ." solto ----
  const semData = describePunchConfirmation({ punchSlot: "entry1" });
  assert.equal(semData.detail, "");
  assert.equal(semData.message, "Entrada 1 registrada.");

  const vazio = describePunchConfirmation({});
  assert.equal(vazio.message, "Ponto registrado com sucesso.");

  // Data ilegivel nao pode vazar para a tela, nem como "Invalid Date" nem crua.
  const dataInvalida = describePunchConfirmation({ systemLocalDate: "nao-e-data" });
  assert.equal(dataInvalida.detail, "");
  assert.equal(dataInvalida.message, "Ponto registrado com sucesso.");

  console.log("punchLabel.check: ok");
}

run();
