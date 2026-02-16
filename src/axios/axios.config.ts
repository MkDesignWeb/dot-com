import axios from "axios";

export const api = axios.create();

api.interceptors.request.use(async config => {
  const cfg = await window.config.get();
  if (!cfg) {
    throw new Error("Configuração não encontrada");
  }
  if(!cfg.ip || !cfg.port) {
    throw new Error("Configuração inválida: IP ou Porta não definidos");
  }

  config.baseURL = `http://${cfg.ip}:${cfg.port}`;

  return config;
});