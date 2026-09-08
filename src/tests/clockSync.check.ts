import assert from "node:assert/strict";
import {
  INITIAL_CLOCK_SYNC,
  RETRY_INTERVAL_MS,
  SYNC_INTERVAL_MS,
  applySyncFailure,
  applySyncRetrying,
  applySyncSuccess,
  currentServerTime,
  nextSyncDelayMs,
} from "../utils/clockSync";

/**
 * O caso que motivou este modulo: uma falha de rede DEPOIS de uma sincronia
 * bem-sucedida nao pode apagar o relogio da tela.
 */

function run() {
  // ---- Primeira sincronia ----
  // Sem nunca ter sincronizado, falhar e visivel: nao ha hora para mostrar.
  const primeiraFalha = applySyncFailure(INITIAL_CLOCK_SYNC);
  assert.equal(primeiraFalha.status, "error");
  assert.equal(primeiraFalha.isOutOfSync, true);
  assert.equal(primeiraFalha.lastSyncAt, null);
  assert.equal(primeiraFalha.offsetMs, 0);

  // ---- Sincronia bem-sucedida ----
  // Maquina 5 minutos atrasada em relacao ao servidor.
  const maquina = 1_000_000;
  const servidor = maquina + 5 * 60_000;
  const sincronizado = applySyncSuccess(INITIAL_CLOCK_SYNC, servidor, maquina);
  assert.equal(sincronizado.status, "success");
  assert.equal(sincronizado.offsetMs, 300_000);
  assert.equal(sincronizado.isOutOfSync, false);
  assert.equal(sincronizado.lastSyncAt, maquina);

  // O relogio exibido e o do servidor, nao o da maquina.
  assert.equal(currentServerTime(sincronizado, maquina).getTime(), servidor);
  assert.equal(currentServerTime(sincronizado, maquina + 1000).getTime(), servidor + 1000);

  // ---- O BUG: falha depois de ja ter sincronizado ----
  // Antes isto virava status "error" e a TimePage trocava o relogio inteiro por
  // um cartao de erro — com um deslocamento valido medido segundos antes.
  const blip = applySyncFailure(sincronizado);
  assert.equal(blip.status, "success", "o relogio tem de continuar na tela");
  assert.equal(blip.offsetMs, 300_000, "o deslocamento medido nao se perde");
  assert.equal(blip.isOutOfSync, true, "mas a perda de sincronia fica sinalizada");
  assert.equal(blip.lastSyncAt, maquina);

  // E continua contando o tempo normalmente enquanto esta fora de sincronia.
  assert.equal(currentServerTime(blip, maquina + 30_000).getTime(), servidor + 30_000);

  // Falhas seguidas nao pioram nada nem zeram o deslocamento.
  const blipDuplo = applySyncFailure(blip);
  assert.equal(blipDuplo.status, "success");
  assert.equal(blipDuplo.offsetMs, 300_000);

  // ---- Recuperacao ----
  const voltou = applySyncSuccess(blipDuplo, servidor + 120_000, maquina + 120_000);
  assert.equal(voltou.status, "success");
  assert.equal(voltou.isOutOfSync, false);
  assert.equal(voltou.offsetMs, 300_000);
  assert.equal(voltou.lastSyncAt, maquina + 120_000);

  // ---- Cadencia ----
  // Fora de sincronia tenta mais vezes, para voltar antes.
  assert.equal(nextSyncDelayMs(sincronizado), SYNC_INTERVAL_MS);
  assert.equal(nextSyncDelayMs(blip), RETRY_INTERVAL_MS);
  assert.equal(nextSyncDelayMs(INITIAL_CLOCK_SYNC), SYNC_INTERVAL_MS);
  assert.equal(SYNC_INTERVAL_MS, 60_000);
  assert.equal(RETRY_INTERVAL_MS, 10_000);
  assert.ok(RETRY_INTERVAL_MS < SYNC_INTERVAL_MS);

  // ---- Botao "Tentar novamente" ----
  // Quem nunca sincronizou volta para o spinner; quem ja tem hora na tela
  // continua com ela, sem piscar.
  assert.equal(applySyncRetrying(primeiraFalha).status, "loading");
  assert.equal(applySyncRetrying(blip).status, "success");
  assert.equal(applySyncRetrying(blip).offsetMs, 300_000);

  // ---- Deslocamento negativo (maquina adiantada) ----
  const adiantada = applySyncSuccess(INITIAL_CLOCK_SYNC, maquina - 90_000, maquina);
  assert.equal(adiantada.offsetMs, -90_000);
  assert.equal(currentServerTime(adiantada, maquina).getTime(), maquina - 90_000);

  // ---- Nenhuma transicao muta o estado anterior ----
  assert.equal(sincronizado.isOutOfSync, false);
  assert.equal(INITIAL_CLOCK_SYNC.status, "loading");
  assert.equal(INITIAL_CLOCK_SYNC.lastSyncAt, null);

  console.log("clockSync.check: ok");
}

run();
