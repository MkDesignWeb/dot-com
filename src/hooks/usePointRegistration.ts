import { useState } from "react";
import axios from "axios";
import punchService from "../services/punchService";

export type PointStatus = "idle" | "loading" | "success" | "error" | "maxPunch";

export const usePointRegistration = () => {
  const [status, setStatus] = useState<PointStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [systemLocalDate, setSystemLocalDate] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const reset = () => {
    setStatus("idle");
    setErrorMessage("");
    setPassword("");
    setSystemLocalDate("");
    setEmployeeName("");
  };

  const handleRequestError = (error: unknown) => {
    const fallbackMessage = "Nao foi possivel registrar o ponto.";
    const message = axios.isAxiosError<{ error?: string }>(error)
      ? (error.response?.data?.error ?? error.message)
      : fallbackMessage;

    setErrorMessage(message || fallbackMessage);
    setStatus(message === "Limite de pontos atingido para hoje" ? "maxPunch" : "error");
  };

  const handleSuccess = (systemDate?: string, confirmedEmployeeName?: string) => {
    setSystemLocalDate(systemDate ?? "");
    setEmployeeName(confirmedEmployeeName ?? "");
    setStatus("success");
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
      handleSuccess(response.systemLocalDate, response.punch?.employeeName);
    } catch (error) {
      handleRequestError(error);
    }
  };

  const registerPointWithDescriptor = async (descriptor: number[]) => {
    if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) {
      setErrorMessage("Nao foi possivel gerar uma referencia facial valida.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");
      const response = await punchService.setFaceReferencePunch(descriptor);
      handleSuccess(response.systemLocalDate, response.punch?.employeeName);
    } catch (error) {
      handleRequestError(error);
    }
  };

  return {
    status,
    errorMessage,
    password,
    setPassword,
    systemLocalDate,
    employeeName,
    registerPoint,
    registerPointWithDescriptor,
    reset,
  };
};
