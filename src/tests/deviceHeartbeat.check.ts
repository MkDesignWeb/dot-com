import assert from "node:assert/strict";

/**
 * Cadencia do anuncio deste dispositivo ao servidor.
 *
 * O caso que este arquivo existe para proteger e o 404. E tentador tratar
 * "servidor nao conhece a rota" como "desista": economiza requisicoes e parece
 * limpo. Mas o servidor sobe PRIMEIRO numa atualizacao — se o terminal desistisse
 * ao ver um servidor antigo, ele sumiria da lista justo depois da atualizacao
 * que o faria aparecer nela, e so voltaria se alguem reiniciasse a maquina.
 */
async function main() {
  const {
    nextIntervalAfterError,
    clampSeconds,
    RETRY_INTERVAL_SECONDS,
    UNSUPPORTED_INTERVAL_SECONDS,
    DEFAULT_INTERVAL_SECONDS,
    MIN_INTERVAL_SECONDS,
    MAX_INTERVAL_SECONDS
  } = await import("../services/deviceHeartbeat");

  // Servidor anterior ao nivel 11: espaca bastante, mas continua tentando.
  assert.equal(nextIntervalAfterError({ response: { status: 404 } }), UNSUPPORTED_INTERVAL_SECONDS);
  assert.ok(UNSUPPORTED_INTERVAL_SECONDS > RETRY_INTERVAL_SECONDS);
  assert.ok(Number.isFinite(UNSUPPORTED_INTERVAL_SECONDS), "404 nao pode virar 'nunca mais'");

  // Rede fora, servidor reiniciando, endereco ainda nao descoberto: volta logo.
  assert.equal(nextIntervalAfterError(new Error("network")), RETRY_INTERVAL_SECONDS);
  assert.equal(nextIntervalAfterError({ response: { status: 500 } }), RETRY_INTERVAL_SECONDS);
  assert.equal(nextIntervalAfterError(null), RETRY_INTERVAL_SECONDS);
  assert.equal(nextIntervalAfterError(undefined), RETRY_INTERVAL_SECONDS);

  // A cadencia vem do servidor, mas dentro de limites nossos: um valor absurdo
  // (ou ausente, ou hostil) nao pode virar um laco de requisicoes nem silencio
  // de horas.
  assert.equal(clampSeconds(30, DEFAULT_INTERVAL_SECONDS), 30);
  assert.equal(clampSeconds(0, DEFAULT_INTERVAL_SECONDS), MIN_INTERVAL_SECONDS);
  assert.equal(clampSeconds(-1, DEFAULT_INTERVAL_SECONDS), MIN_INTERVAL_SECONDS);
  assert.equal(clampSeconds(86400, DEFAULT_INTERVAL_SECONDS), MAX_INTERVAL_SECONDS);
  assert.equal(clampSeconds(undefined, DEFAULT_INTERVAL_SECONDS), DEFAULT_INTERVAL_SECONDS);
  assert.equal(clampSeconds("60", DEFAULT_INTERVAL_SECONDS), DEFAULT_INTERVAL_SECONDS);
  assert.equal(clampSeconds(Number.NaN, DEFAULT_INTERVAL_SECONDS), DEFAULT_INTERVAL_SECONDS);

  console.log("deviceHeartbeat.check: ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
