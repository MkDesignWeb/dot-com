import axios from "axios";

export const api = axios.create();

api.interceptors.request.use(async (config) => {
  const cfg = await window.config.get();
  if (!cfg?.ip || !cfg?.port) {
    throw new Error("Configuracao invalida: IP ou porta nao definidos.");
  }

  config.baseURL = `http://${cfg.ip}:${cfg.port}`;
  return config;
});
