import { api } from "../axios/axios.config";
import type { TimeResponse } from "../types/api";

class TimeService {
  async getTime(): Promise<number> {
    const response = await api.get<TimeResponse>("/time");
    return response.data.serverTime;
  }
}

export default new TimeService();
