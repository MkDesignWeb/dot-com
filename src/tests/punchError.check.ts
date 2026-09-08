import assert from "node:assert/strict";
import { describePunchError, FALLBACK_ERROR_MESSAGE } from "../utils/punchError";

function run() {
  // ---- Funcionario desligado ----
  // A mensagem e nossa, nao a do servidor: e ela que diz o que fazer em seguida.
  const terminated = describePunchError(
    { error: "Funcionário inativado, contate o supervisor responsável", code: "EMPLOYEE_TERMINATED" },
    "Funcionário inativado, contate o supervisor responsável"
  );
  assert.equal(terminated.status, "inactive");
  assert.equal(terminated.message, "Funcionário inativado, contate o supervisor responsável.");

  // O codigo manda, mesmo que o texto do servidor mude.
  const terminatedOtherText = describePunchError(
    { error: "qualquer outro texto", code: "EMPLOYEE_TERMINATED" },
    "qualquer outro texto"
  );
  assert.equal(terminatedOtherText.status, "inactive");

  // ---- Limite diario ----
  const maxByCode = describePunchError(
    { error: "Limite de pontos atingido para hoje", code: "MAX_PUNCHES_REACHED" },
    "Limite de pontos atingido para hoje"
  );
  assert.equal(maxByCode.status, "maxPunch");
  assert.equal(maxByCode.message, "Limite de 4 marcacoes atingido hoje. Procure o responsavel.");

  // Ponte para servidor antigo, que ainda nao manda `code`: so o texto exato
  // vale, para nao classificar erro alheio como limite.
  const maxByLegacyText = describePunchError(undefined, "Limite de pontos atingido para hoje");
  assert.equal(maxByLegacyText.status, "maxPunch");

  // ---- Erro comum ----
  const unknownFace = describePunchError({ error: "Face não reconhecida" }, "Face não reconhecida");
  assert.equal(unknownFace.status, "error");
  assert.equal(unknownFace.message, "Face não reconhecida");

  // Sem mensagem nenhuma, cai no texto padrao em vez de um alerta vazio.
  assert.equal(describePunchError(undefined, "").message, FALLBACK_ERROR_MESSAGE);
  assert.equal(describePunchError(undefined, "").status, "error");

  // Codigo desconhecido (servidor mais novo que o terminal) nao vira estado
  // especial: mostra a mensagem que veio e deixa tentar de novo.
  const futureCode = describePunchError(
    { error: "Regra nova", code: "SOMETHING_NEW" },
    "Regra nova"
  );
  assert.equal(futureCode.status, "error");
  assert.equal(futureCode.message, "Regra nova");

  console.log("punchError.check: ok");
}

run();
