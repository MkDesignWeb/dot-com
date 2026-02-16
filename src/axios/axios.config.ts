import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const axiosConfig: AxiosRequestConfig = {
    baseURL: 'http://localhost:3000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

const axiosInstance: AxiosInstance = axios.create(axiosConfig);


export default axiosInstance;