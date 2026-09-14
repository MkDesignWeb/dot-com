import { api } from "../axios/axios.config";
import { isAppBusy } from "../utils/appBusy";

/**
 * Anuncio periodico deste dispositivo ao servidor.
 *
 * Por que existe: o servidor nao consegue falar com este app por iniciativa
 * propria — nao ha porta escutando deste lado. Para a atualizacao coordenada,
 * quem pergunta "tem algo para mim?" e sempre o dispositivo. Este e o unico
 * canal, e e por ele que a ordem de atualizar vai chegar.
 *
 * Por que no renderer e nao no processo principal: aqui o endereco do servidor
 * ja foi descoberto e o cliente HTTP ja existe, com token e reconexao. So a
 * IDENTIDADE vem do processo principal (`window.device`), porque ela precisa
 * sobreviver a um reload da tela.
 *
 * Regra que atravessa o arquivo inteiro: **falhar aqui nao pode atrapalhar
 * nada**. O terminal nao depende de estar registrado para funcionar. Nenhum erro
 * daqui sobe, aparece na tela ou interrompe o ciclo.
 */

export const DEFAULT_INTERVAL_SECONDS = 60;
export const MIN_INTERVAL_SECONDS = 5;
export const MAX_INTERVAL_SECONDS = 15 * 60;

/** Servidor fora do ar, rede caida, endereco ainda nao descoberto. */
export const RETRY_INTERVAL_SECONDS = 120;

/**
 * Servidor anterior ao nivel 11 nao conhece a rota.
 *
 * Espacamos bastante, mas NAO desistimos: numa atualizacao o servidor sobe
 * primeiro e este app precisa aparecer na lista logo depois. Se parasse de
 * tentar no primeiro 404, so voltaria a existir para o painel depois de alguem
 * reiniciar a maquina — justo no momento em que a lista precisa estar completa.
 */
export const UNSUPPORTED_INTERVAL_SECONDS = MAX_INTERVAL_SECONDS;

let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;

/**
 * Ultimo estado relatado pelo processo principal.
 *
 * Fica aqui, e nao numa rota propria, porque o heartbeat ja e uma conversa a
 * cada poucos segundos. Uma segunda via so para progresso dobraria o trafego
 * justamente quando a rede esta ocupada baixando o instalador.
 */
let lastProgress: unknown = null;
let listeningProgress = false;

/**
 * Endereco absoluto do instalador no servidor.
 *
 * O terminal guarda um unico endereco na configuracao, entao a montagem e
 * direta. O caminho relativo vem da ordem, e nao de uma constante aqui: quem
 * decide onde o arquivo mora e o servidor.
 */
async function resolveFileUrl(relative: string): Promise<string | null> {
  const cfg = await window.config.get();
  if (!cfg?.ip || !cfg?.port) return null;

  return `http://${cfg.ip}:${cfg.port}/api${relative}`;
}

export function clampSeconds(value: unknown, fallback: number): number {
  const seconds = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, seconds));
}


/**
 * Quanto esperar depois de uma falha.
 *
 * Nenhum caminho devolve "nunca mais". Um servidor que hoje responde 404 pode
 * ser o mesmo servidor que, dez minutos depois, ja foi atualizado e passou a
 * conhecer a rota — e e exatamente ai que este app precisa aparecer na lista.
 */
export function nextIntervalAfterError(error: unknown): number {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return status === 404 ? UNSUPPORTED_INTERVAL_SECONDS : RETRY_INTERVAL_SECONDS;
}

/** Devolve em quantos segundos tentar de novo. Nunca lanca. */
async function beat(): Promise<number> {
  try {
    const identity = await window.device.identity();
    const response = await api.post("/devices/heartbeat", {
      ...identity,
      // O que este dispositivo esta fazendo com a ordem anterior segue junto:
      // uma requisicao, nao duas.
      ...(lastProgress ? { update: lastProgress } : {})
    });

    const order = (response.data as { update?: unknown } | undefined)?.update;
    if (order) {
      /**
       * Batida em andamento adia a atualizacao para o proximo heartbeat.
       *
       * O instalador reinicia o aplicativo. Fazer isso no meio de uma batida
       * perderia hora trabalhada de alguem — e a campanha nao tem pressa: dez
       * segundos depois a ordem volta igual.
       */
      if (!isAppBusy()) {
        const fileUrl = await resolveFileUrl((order as { url: string }).url);

        /**
         * Repassa e segue. A validacao de verdade — inclusive recusar a ordem
         * inteira — acontece no processo principal, que e quem vai gravar em
         * disco e executar. Aqui nao se decide nada sobre um executavel.
         */
        if (fileUrl) void window.updater.apply(order, fileUrl);
      }
    }

    // A cadencia e do servidor, nao nossa: assim ele pode apertar o intervalo
    // durante uma atualizacao, para o progresso aparecer em segundos, sem
    // precisar republicar este app.
    return clampSeconds(response.data?.nextHeartbeatInSeconds, DEFAULT_INTERVAL_SECONDS);
  } catch (error: unknown) {
    return nextIntervalAfterError(error);
  }
}

function schedule(seconds: number) {
  timer = setTimeout(() => {
    void beat().then(schedule);
  }, seconds * 1000);
}

/**
 * Liga o ciclo. Idempotente: chamar duas vezes nao cria dois cronometros — o
 * StrictMode do React monta os efeitos duas vezes em desenvolvimento, e dois
 * ciclos concorrentes gerariam o dobro de requisicoes sem nenhum ganho.
 */
export function startDeviceHeartbeat() {
  if (started) return;
  started = true;

  if (!listeningProgress) {
    listeningProgress = true;
    window.updater.onProgress((progress) => {
      lastProgress = progress;
    });
  }

  void beat().then(schedule);
}

export function stopDeviceHeartbeat() {
  if (timer) clearTimeout(timer);
  timer = null;
  started = false;
}
