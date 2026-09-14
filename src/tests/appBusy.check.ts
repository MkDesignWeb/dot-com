import assert from "node:assert/strict";
import { isAppBusy, whileBusy } from "../utils/appBusy";

/**
 * Trava que adia a atualizacao enquanto uma batida esta em andamento.
 *
 * O instalador reinicia o terminal. Se isso acontecer entre o funcionario
 * encostar o rosto na camera e o servidor gravar a batida, a batida se perde —
 * e isso nao e um erro de software, e hora trabalhada que some da folha de
 * alguem e que ninguem percebe no mesmo dia.
 */
async function main() {
  assert.equal(isAppBusy(), false);

  // ---- Marca e libera ----
  let duranteAOperacao = false;
  await whileBusy(async () => {
    duranteAOperacao = isAppBusy();
  });

  assert.equal(duranteAOperacao, true);
  assert.equal(isAppBusy(), false);

  // ---- Falha tambem libera ----
  // Uma batida recusada pelo servidor nao pode deixar o terminal ocupado para
  // sempre: na pratica isso seria uma maquina que nunca mais atualiza.
  await assert.rejects(
    whileBusy(async () => {
      throw new Error("servidor recusou");
    }),
    /servidor recusou/
  );
  assert.equal(isAppBusy(), false);

  // ---- Operacoes sobrepostas ----
  // E um contador, e nao um booleano, porque duas batidas podem se sobrepor:
  // com booleano, a que terminasse primeiro liberaria a trava da outra — e a
  // segunda seria interrompida pelo instalador no meio.
  let liberaPrimeira: (() => void) | null = null;
  let liberaSegunda: (() => void) | null = null;

  const primeira = whileBusy(() => new Promise<void>(resolve => { liberaPrimeira = resolve }));
  const segunda = whileBusy(() => new Promise<void>(resolve => { liberaSegunda = resolve }));

  assert.equal(isAppBusy(), true);

  liberaPrimeira!();
  await primeira;
  assert.equal(isAppBusy(), true, "a segunda batida ainda esta em andamento");

  liberaSegunda!();
  await segunda;
  assert.equal(isAppBusy(), false);

  console.log("appBusy.check: ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
