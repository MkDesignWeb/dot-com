import { api } from "../axios/axios.config";
import type { PunchResponse } from "../types/api";
import { whileBusy } from "../utils/appBusy";

/**
 * As duas chamadas ficam dentro de `whileBusy` porque sao o momento em que o
 * terminal nao pode ser reiniciado: a atualizacao remota chega pelo heartbeat a
 * qualquer instante, e o instalador reinicia o aplicativo. Uma batida
 * interrompida entre o envio e a resposta some — e ninguem descobre no mesmo
 * dia.
 */
class PunchService {
  async setPunch(employeeId: string, password: string): Promise<PunchResponse> {
    return await whileBusy(async () => {
      const response = await api.post<PunchResponse>("/punch", { employeeId, password });
      return response.data;
    });
  }

  /**
   * `photo` e a evidencia da batida: fica guardada no servidor para auditoria.
   * Opcional de proposito — se a captura falhar, a batida ainda acontece.
   */
  async setFaceReferencePunch(descriptor: number[], photo?: string): Promise<PunchResponse> {
    return await whileBusy(async () => {
      const response = await api.post<PunchResponse>("/punch/face-reference", {
        descriptor,
        ...(photo ? { photo } : {}),
      });
      return response.data;
    });
  }
}

export default new PunchService();
