export interface User {
  id: number;
  name: string;
  companny: string;
  /** Matricula. `null` = nao informada. Distingue homonimos na lista. */
  registration?: string | null;
  level?: number;
  admissionDate?: string;
}
