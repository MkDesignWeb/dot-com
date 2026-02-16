import axiosInstance from "../axios/axios.config";

class timeService {
    async getTime() {
        const res = await axiosInstance.get('/time');
        return res;
    }
}

export default new timeService();