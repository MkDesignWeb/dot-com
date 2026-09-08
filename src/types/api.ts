export type TimeResponse = {
  serverTime: number;
  /**
   * Campos ausentes em servidor anterior a sincronizacao oficial. Sem eles a
   * hora NAO e apresentada como oficial.
   */
  officialTime?: boolean;
  source?: string | null;
  syncedAt?: string | null;
  offsetMs?: number;
  stale?: boolean;
};

/** As quatro marcacoes possiveis num dia, na ordem cronologica. */
export type PunchSlot = "entry1" | "exit1" | "entry2" | "exit2";

export type PunchPayload = {
  punch?: {
    id: number;
    employeeId: number;
    employeeName: string;
    timeStamp: string;
    displayTimeBr: string;
    reportDayBr: string;
    reportTimeBr: string;
  };
  /**
   * Qual das quatro marcacoes do dia esta batida ocupa.
   * Ausente em servidor anterior a esta versao — sempre ler com fallback.
   */
  punchSlot?: PunchSlot | null;
  systemDisplayDateBr?: string;
  punchDisplayTimeBr?: string;
};

export type PunchResponse = {
  systemLocalDate?: string;
} & PunchPayload;

/** Codigos de erro legiveis por maquina. Ausentes em servidor antigo. */
export const MAX_PUNCHES_REACHED = "MAX_PUNCHES_REACHED";
/** Funcionario desligado: a batida e recusada em qualquer caminho. */
export const EMPLOYEE_TERMINATED = "EMPLOYEE_TERMINATED";

export type PunchErrorResponse = {
  error?: string;
  code?: string;
};
