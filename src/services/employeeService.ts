import { api } from "../axios/axios.config";
import type { User } from "../types/userType";

class EmployeeService {
  async getEmployees(): Promise<User[]> {
    const response = await api.get<User[]>("/employee");
    return response.data;
  }
}

export default new EmployeeService();
