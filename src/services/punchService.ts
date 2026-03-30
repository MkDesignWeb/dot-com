import { api } from "../axios/axios.config";
import type { PunchResponse } from "../types/api";

class PunchService {
  async setPunch(employeeId: string, password: string): Promise<PunchResponse> {
    const response = await api.post<PunchResponse>("/punch", { employeeId, password });
    return response.data;
  }

  async setFaceReferencePunch(descriptor: number[]): Promise<PunchResponse> {
    const response = await api.post<PunchResponse>("/punch/face-reference", { descriptor });
    return response.data;
  }
}

export default new PunchService();
