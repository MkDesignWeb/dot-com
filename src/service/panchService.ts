import axiosInstance from "../axios/axios.config";

class panchService {
    async setPanch(employeeId: string, password: string) {
        const res = await axiosInstance.post('/punch', { employeeId, password })
        return res;
    }
}

export default new panchService();