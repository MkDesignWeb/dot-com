import { api } from "../axios/axios.config";

class panchService {
    async setPanch(employeeId: string, password: string) {
        const res = await api.post('/punch', { employeeId, password })
        return res;
    }
}

export default new panchService();