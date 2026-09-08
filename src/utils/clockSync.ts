/**
 * Estado da sincronia do relogio com o servidor.
 *
 * O terminal nunca usa o relogio do Windows como verdade: ele mede a diferenca
 * para o servidor uma vez e depois so conta o tempo. O ponto delicado e o que
 * fazer quando uma sincronia FALHA depois de ja ter dado certo — antes disso o
 * relogio inteiro sumia da tela e dava lugar a um cartao de erro, mesmo havendo
 * um deslocamento valido medido segundos antes.
 *
 * A regra: perder a sincronia nunca apaga o relogio. So a primeira sincronia
 * pode falhar de forma visivel, porque ai realmente nao ha hora para mostrar.
 */

/** Intervalo normal entre sincronias. */
export const SYNC_INTERVAL_MS = 60_000;

/** Enquanto esta fora de sincronia, tenta com mais frequencia para voltar antes. */
export const RETRY_INTERVAL_MS = 10_000;

export type ClockSyncStatus = "loading" | "error" | "success";

export type ClockSyncState = {
  status: ClockSyncStatus;
  /** Quanto somar ao relogio da maquina para chegar no horario do servidor. */
  offsetMs: number;
  /** Ja teve sucesso alguma vez, mas a ultima tentativa falhou. */
  isOutOfSync: boolean;
  /** Instante (relogio da maquina) da ultima sincronia bem-sucedida. */
  lastSyncAt: number | null;
};

export const INITIAL_CLOCK_SYNC: ClockSyncState = {
  status: "loading",
  offsetMs: 0,
  isOutOfSync: false,
  lastSyncAt: null,
};

export const applySyncSuccess = (
  state: ClockSyncState,
  serverTimeMs: number,
  nowMs: number
): ClockSyncState => ({
  ...state,
  status: "success",
  offsetMs: serverTimeMs - nowMs,
  isOutOfSync: false,
  lastSyncAt: nowMs,
});

export const applySyncFailure = (state: ClockSyncState): ClockSyncState => ({
  ...state,
  // Ja sincronizou antes: mantem o relogio na tela com o ultimo deslocamento.
  // O desvio de alguns minutos e irrelevante perto de nao mostrar hora nenhuma.
  status: state.lastSyncAt === null ? "error" : "success",
  isOutOfSync: true,
});

/** Volta ao estado de primeira carga — usado pelo botao "Tentar novamente". */
export const applySyncRetrying = (state: ClockSyncState): ClockSyncState => ({
  ...state,
  status: state.lastSyncAt === null ? "loading" : "success",
});

export const nextSyncDelayMs = (state: ClockSyncState) =>
  state.isOutOfSync ? RETRY_INTERVAL_MS : SYNC_INTERVAL_MS;

/** Horario do servidor agora, derivado do relogio da maquina mais o desvio medido. */
export const currentServerTime = (state: ClockSyncState, nowMs: number) =>
  new Date(nowMs + state.offsetMs);
