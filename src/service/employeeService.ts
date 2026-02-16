import { api } from "../axios/axios.config";

class employeeService {
    async getEmployees() {
        const res = await api.get('/employee')
        return res;
    }
}

export default new employeeService();