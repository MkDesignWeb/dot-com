import assert from "node:assert/strict";
import {
  DEFAULT_DETECTION_INTERVAL_MS,
  createDetectionThrottle,
} from "../utils/detectionThrottle";

/**
 * Simula o relogio do `requestAnimationFrame` (60 quadros por segundo) e conta
 * quantos deles chegam a rodar o modelo. Antes desta mudanca a resposta era
 * "todos".
 */
const countRunsIn = (durationMs: number, frameMs: number, intervalMs: number) => {
  const throttle = createDetectionThrottle(intervalMs);
  let runs = 0;

  for (let now = 0; now < durationMs; now += frameMs) {
    if (throttle.shouldRun(now)) runs += 1;
  }

  return runs;
};

function run() {
  assert.equal(DEFAULT_DETECTION_INTERVAL_MS, 200);

  const FRAME_60_FPS = 1000 / 60;

  // Um segundo a 60fps sao 60 quadros. Com o intervalo padrao, 5 leituras.
  const quadrosEmUmSegundo = Math.ceil(1000 / FRAME_60_FPS);
  assert.equal(quadrosEmUmSegundo, 60);
  assert.equal(countRunsIn(1000, FRAME_60_FPS, DEFAULT_DETECTION_INTERVAL_MS), 5);

  // Dez segundos a 60Hz: 600 quadros viram 49 leituras — mais de 12x menos
  // trabalho. Nao sao 50 exatos porque o quadro so cai em multiplos de 16,67ms,
  // entao cada leitura atrasa um pouco e a deriva se acumula.
  assert.equal(countRunsIn(10_000, FRAME_60_FPS, DEFAULT_DETECTION_INTERVAL_MS), 49);

  // Monitor mais rapido nao aumenta a carga: o limite e por tempo, nao por
  // quadro. 1440 quadros dao praticamente as mesmas leituras que 600.
  assert.equal(countRunsIn(10_000, 1000 / 144, DEFAULT_DETECTION_INTERVAL_MS), 50);
  assert.equal(countRunsIn(10_000, 1000 / 30, DEFAULT_DETECTION_INTERVAL_MS), 47);

  // ---- A primeira leitura e imediata ----
  // Sem isto o retangulo demoraria um intervalo para aparecer na abertura.
  const novo = createDetectionThrottle(200);
  assert.equal(novo.shouldRun(0), true);
  assert.equal(novo.shouldRun(1), false);
  assert.equal(novo.shouldRun(199), false);
  assert.equal(novo.shouldRun(200), true);
  assert.equal(novo.shouldRun(201), false);

  // ---- A cadencia acompanha o relogio, nao a contagem de chamadas ----
  // Se uma inferencia demorar mais que o intervalo, o proximo quadro ja roda.
  const lento = createDetectionThrottle(200);
  assert.equal(lento.shouldRun(0), true);
  assert.equal(lento.shouldRun(900), true);
  assert.equal(lento.shouldRun(1000), false);
  assert.equal(lento.shouldRun(1100), true);

  // Intervalo zero desliga o limite, sem travar.
  const semLimite = createDetectionThrottle(0);
  assert.equal(semLimite.shouldRun(0), true);
  assert.equal(semLimite.shouldRun(0), true);

  console.log("detectionThrottle.check: ok");
}

run();
