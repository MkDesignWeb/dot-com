import { useCallback, useEffect, useRef, useState } from "react";
import timeService from "../services/timeService";
import { parseTimeSource, UNKNOWN_TIME_SOURCE, type TimeSourceInfo } from "../utils/timeSource";
import {
  INITIAL_CLOCK_SYNC,
  applySyncFailure,
  applySyncRetrying,
  applySyncSuccess,
  currentServerTime,
  nextSyncDelayMs,
  type ClockSyncState,
} from "../utils/clockSync";

/**
 * Relogio do terminal, sincronizado com o servidor.
 *
 * As transicoes de estado ficam em `clockSync`, testadas a parte. Aqui sobra o
 * agendamento: uma sincronia se agenda a proxima, com atraso que depende do
 * resultado da anterior — mais curto enquanto esta fora de sincronia. Um
 * `setInterval` fixo nao daria isso sem recriar o intervalo a cada mudanca.
 */
export const useServerTime = () => {
  const [sync, setSync] = useState<ClockSyncState>(INITIAL_CLOCK_SYNC);
  const [time, setTime] = useState(() => new Date());

  /**
   * Procedencia da hora, separada do estado de sincronia.
   *
   * Sao dois problemas distintos: o terminal pode estar perfeitamente conectado
   * a um servidor que nao conseguiu falar com o NTP.br. Misturar os dois num
   * aviso so escondia justamente o caso em que tudo parece certo.
   */
  const [timeSource, setTimeSource] = useState<TimeSourceInfo>(UNKNOWN_TIME_SOURCE);

  // O agendamento precisa do estado mais recente sem entrar nas dependencias do
  // efeito: caso contrario cada sincronia reiniciaria o proprio laco.
  const syncRef = useRef(sync);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  const syncNowRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let active = true;
    let timerId: number | undefined;

    const syncWithServer = async () => {
      try {
        const response = await timeService.getTimeWithSource();
        if (!active) return;
        setSync((previous) => applySyncSuccess(previous, response.serverTime, Date.now()));
        setTimeSource(parseTimeSource(response));
      } catch {
        if (!active) return;
        setSync(applySyncFailure);
      } finally {
        if (active) {
          timerId = window.setTimeout(syncWithServer, nextSyncDelayMs(syncRef.current));
        }
      }
    };

    syncNowRef.current = syncWithServer;
    void syncWithServer();

    return () => {
      active = false;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  // O relogio anda enquanto houver um deslocamento medido — inclusive fora de
  // sincronia, que e justamente o caso em que ele nao pode sumir da tela.
  useEffect(() => {
    if (sync.status !== "success") return;

    const tick = window.setInterval(() => {
      setTime(currentServerTime(syncRef.current, Date.now()));
    }, 1000);

    // Sem isto, a primeira atualizacao so viria um segundo depois. Le pelo ref
    // para o efeito depender so dos dois primitivos das dependencias.
    setTime(currentServerTime(syncRef.current, Date.now()));

    return () => {
      window.clearInterval(tick);
    };
  }, [sync.status, sync.offsetMs]);

  const retry = useCallback(async () => {
    setSync(applySyncRetrying);
    await syncNowRef.current();
  }, []);

  return {
    status: sync.status,
    isOutOfSync: sync.isOutOfSync,
    time,
    timeSource,
    retry,
  };
};
