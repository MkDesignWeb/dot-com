import { useState } from "react";
import axios from "axios";
import punchService from "../services/punchService";
import { type PunchErrorResponse, type PunchResponse } from "../types/api";
import { describePunchConfirmation, type PunchConfirmation } from "../utils/punchLabel";
import { describePunchError, FALLBACK_ERROR_MESSAGE } from "../utils/punchError";

export type PointStatus = "idle" | "loading" | "success" | "error" | "maxPunch" | "inactive";

export const usePointRegistration = () => {
  const [status, setStatus] = useState<PointStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  /** Confirmacao pronta da batida, ja com o rotulo da marcacao. */
  const [confirmation, setConfirmation] = useState<PunchConfirmation | null>(null);

  const reset = () => {
    setStatus("idle");
    setErrorMessage("");
    setPassword("");
    setConfirmation(null);
    setEmployeeName("");
  };

  const handleRequestError = (error: unknown) => {
    const data = axios.isAxiosError<PunchErrorResponse>(error) ? error.response?.data : undefined;
    const rawMessage = axios.isAxiosError<PunchErrorResponse>(error)
      ? (data?.error ?? error.message)
      : FALLBACK_ERROR_MESSAGE;

    const described = describePunchError(data, rawMessage);
    setErrorMessage(described.message);
    setStatus(described.status);
  };

  const handleSuccess = (response: PunchResponse) => {
    setConfirmation(describePunchConfirmation(response));
    setEmployeeName(response.punch?.employeeName ?? "");
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
      handleSuccess(await punchService.setPunch(normalizedEmployeeId, password.trim()));
    } catch (error) {
      handleRequestError(error);
    }
  };

  const registerPointWithDescriptor = async (descriptor: number[], photo?: string) => {
    if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) {
      setErrorMessage("Nao foi possivel gerar uma referencia facial valida.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");
      handleSuccess(await punchService.setFaceReferencePunch(descriptor, photo));
    } catch (error) {
      handleRequestError(error);
    }
  };

  return {
    status,
    errorMessage,
    password,
    setPassword,
    confirmation,
    employeeName,
    registerPoint,
    registerPointWithDescriptor,
    reset,
  };
};
