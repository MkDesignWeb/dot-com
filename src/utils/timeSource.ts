/**
 * De onde vem a hora que o terminal mostra.
 *
 * Sao dois problemas diferentes, e antes os dois viravam o mesmo aviso:
 *
 * - **o terminal perdeu o servidor** — o relogio continua contando com o ultimo
 *   desvio medido, mas vai escorregando;
 * - **o servidor nao conseguiu sincronizar com a Hora Legal Brasileira** — a
 *   conexao esta perfeita e o relogio da tela e exatamente o do servidor; o que
 *   nao da para afirmar e que aquele horario seja o oficial.
 *
 * O segundo caso e o mais traicoeiro: tudo parece certo. Por isso ele tem texto
 * proprio em vez de somar ao aviso de conexao.
 */

export type TimeSourceInfo = {
    /** O servidor confirmou sincronismo com a Hora Legal Brasileira. */
    official: boolean;
    /** Servidor que respondeu ao servidor de ponto (ex.: "a.st1.ntp.br"). */
    source: string | null;
    /** Sincronizacao antiga demais para ser levada a serio. */
    stale: boolean;
};

export const UNKNOWN_TIME_SOURCE: TimeSourceInfo = {
    official: false,
    source: null,
    stale: true
};

export type TimeSourceLabel = {
    /** Linha curta acima do relogio. */
    text: string;
    /** Detalhe para tooltip/segunda linha. Vazio quando nao ha o que dizer. */
    detail: string;
    /** `true` quando o horario nao pode ser apresentado como oficial. */
    warning: boolean;
};

/**
 * Le a resposta de `GET /time` com desconfianca.
 *
 * Servidor anterior a esta versao responde so `serverTime`. Nesse caso a hora
 * NAO e apresentada como oficial — dizer "Horario oficial de Brasilia" sem que
 * ninguem tenha verificado seria pior que nao dizer nada.
 */
export function parseTimeSource(payload: unknown): TimeSourceInfo {
    if (!payload || typeof payload !== "object") {
        return UNKNOWN_TIME_SOURCE;
    }

    const data = payload as Partial<{ officialTime: boolean; source: string; stale: boolean }>;

    return {
        official: data.officialTime === true,
        source: typeof data.source === "string" ? data.source : null,
        stale: data.stale !== false
    };
}

/**
 * Texto acima do relogio.
 *
 * `isOutOfSync` (terminal sem servidor) tem precedencia: nesse estado o que
 * importa nao e a origem da hora, e sim que ela esta parando de valer.
 */
export function describeTimeSource(
    info: TimeSourceInfo,
    options: { isOutOfSync: boolean } = { isOutOfSync: false }
): TimeSourceLabel {
    if (options.isOutOfSync) {
        return {
            text: "Sem conexão com o servidor",
            detail: "O relógio segue contando com o último horário recebido.",
            warning: true
        };
    }

    if (info.official && !info.stale) {
        return {
            text: "Horário oficial de Brasília",
            detail: info.source ? `Sincronizado com ${info.source}` : "Sincronizado com o Observatório Nacional",
            warning: false
        };
    }

    if (info.official && info.stale) {
        return {
            text: "Horário oficial desatualizado",
            detail: "O servidor não consegue renovar a sincronização; o horário pode ter escorregado.",
            warning: true
        };
    }

    return {
        text: "Horário do servidor (não verificado)",
        detail: "Sem sincronismo com a Hora Legal Brasileira.",
        warning: true
    };
}

const utcFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
});

/** "14:32:05 UTC" — a mesma hora na referencia mundial, para conferencia. */
export function formatUtcClock(date: Date): string {
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return `${utcFormatter.format(date)} UTC`;
}
