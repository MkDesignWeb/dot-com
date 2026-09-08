/**
 * Limitador de cadencia do reconhecimento facial.
 *
 * O laco de deteccao roda dentro de um `requestAnimationFrame`, que dispara na
 * taxa do monitor (~60x por segundo). Rodar o modelo a cada quadro mantem a CPU
 * ocupada o tempo todo — num PC de terminal, que costuma ser fraco, e o
 * suficiente para travar a interface.
 *
 * Cinco leituras por segundo bastam para o retangulo acompanhar o rosto. O
 * `requestAnimationFrame` continua sendo o relogio (ele pausa sozinho quando a
 * janela nao esta visivel); este contador so decide quais quadros fazem
 * trabalho de verdade.
 */

/** ~5 leituras por segundo. */
export const DEFAULT_DETECTION_INTERVAL_MS = 200;

export const createDetectionThrottle = (intervalMs: number = DEFAULT_DETECTION_INTERVAL_MS) => {
  let lastRunAt: number | null = null;

  return {
    /** true quando ja passou tempo suficiente desde a ultima leitura. */
    shouldRun(now: number) {
      // A primeira leitura nao espera: o retangulo aparece assim que a camera abre.
      if (lastRunAt === null || now - lastRunAt >= intervalMs) {
        lastRunAt = now;
        return true;
      }

      return false;
    },
  };
};
