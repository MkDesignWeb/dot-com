import { api } from "../axios/axios.config";
import type { PunchResponse } from "../types/api";

class PunchService {
  async setPunch(employeeId: string, password: string): Promise<PunchResponse> {
    const response = await api.post<PunchResponse>("/punch", { employeeId, password });
    return response.data;
  }

  /**
   * `photo` e a evidencia da batida: fica guardada no servidor para auditoria.
   * Opcional de proposito — se a captura falhar, a batida ainda acontece.
   */
  async setFaceReferencePunch(descriptor: number[], photo?: string): Promise<PunchResponse> {
    const response = await api.post<PunchResponse>("/punch/face-reference", {
      descriptor,
      ...(photo ? { photo } : {}),
    });
    return response.data;
  }
}

export default new PunchService();
