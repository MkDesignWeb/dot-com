import { useState } from "react";
import axios from "axios";
import punchService from "../services/punchService";

export type PointStatus = "idle" | "loading" | "success" | "error" | "maxPunch";

export const usePointRegistration = () => {
  const [status, setStatus] = useState<PointStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [systemLocalDate, setSystemLocalDate] = useState("");

  const reset = () => {
    setStatus("idle");
    setErrorMessage("");
    setPassword("");
    setSystemLocalDate("");
  };

  const registerPoint = async (employeeId?: string | number) => {
    if (employeeId === undefined || employeeId === null) {
      setErrorMessage("Usuario invalido para registrar ponto.");
      setStatus("error");
      return;
    }
    const normalizedEmployeeId = String(employeeId).trim();
    if (!normalizedEmployeeId) {
      setErrorMessage("Usuario invalido para registrar ponto.");
      setStatus("error");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Digite a senha para registrar o ponto.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");
      const response = await punchService.setPunch(normalizedEmployeeId, password.trim());
      setSystemLocalDate(response.systemLocalDate ?? "");
      setStatus("success");
    } catch (error) {
      const fallbackMessage = "Nao foi possivel registrar o ponto.";
      const message = axios.isAxiosError<{ error?: string }>(error)
        ? (error.response?.data?.error ?? error.message)
        : fallbackMessage;

      setErrorMessage(message || fallbackMessage);
      setStatus(message === "Limite de pontos atingido para hoje" ? "maxPunch" : "error");
    }
  };

  return {
    status,
    errorMessage,
    password,
    setPassword,
    systemLocalDate,
    registerPoint,
    reset,
  };
};
