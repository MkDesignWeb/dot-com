import { api } from "../axios/axios.config";
import type { TimeResponse } from "../types/api";

class TimeService {
  /** Só o instante — usado pelo laço de sincronia. */
  async getTime(): Promise<number> {
    const response = await api.get<TimeResponse>("/time");
    return response.data.serverTime;
  }

  /** Instante mais a procedencia da hora, para a tela poder dizer de onde veio. */
  async getTimeWithSource(): Promise<TimeResponse> {
    const response = await api.get<TimeResponse>("/time");
    return response.data;
  }
}

export default new TimeService();
