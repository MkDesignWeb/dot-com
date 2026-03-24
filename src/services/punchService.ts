import { api } from "../axios/axios.config";
import type { PunchResponse } from "../types/api";

class PunchService {
  async setPunch(employeeId: string, password: string): Promise<PunchResponse> {
    const response = await api.post<PunchResponse>("/punch", { employeeId, password });
    return response.data;
  }
}

export default new PunchService();
