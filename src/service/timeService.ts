import { api } from "../axios/axios.config";


class timeService {
    async getTime() {
        const res = await api.get('/time');
        return res;
    }
}

export default new timeService();