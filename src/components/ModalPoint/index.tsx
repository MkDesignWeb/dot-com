import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import type { User } from "../../types/userType";
import { usePointRegistration } from "../../hooks/usePointRegistration";

type ModalPointProps = {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  user?: User;
};

const formatPtBrDateTime = (value: string) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const ModalPoint = ({ modalOpen, setModalOpen, user }: ModalPointProps) => {
  const navigate = useNavigate();
  const { status, errorMessage, password, setPassword, systemLocalDate, registerPoint, reset } = usePointRegistration();

  const handleClose = useCallback(() => {
    setModalOpen(false);
    reset();
  }, [reset, setModalOpen]);

  useEffect(() => {
    if (!modalOpen) return;

    if (status === "success" || status === "maxPunch") {
      const timer = setTimeout(() => {
        handleClose();
        navigate("/");
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (status === "error") {
      const timer = setTimeout(() => reset(), 2500);
      return () => clearTimeout(timer);
    }
  }, [handleClose, modalOpen, navigate, reset, status]);

  return (
    <Dialog
      open={modalOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>{user?.name ?? "Registrar ponto"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Empresa: {user?.companny ?? "-"}
          </Typography>

          {(status === "idle" || status === "loading") && (
            <TextField
              type="password"
              label="Senha"
              placeholder="Digite a senha do ponto digital"
              autoFocus
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {status === "success" && (
            <Alert severity="success" variant="filled">
              Ponto registrado com sucesso {systemLocalDate ? `em ${formatPtBrDateTime(systemLocalDate)}` : ""}.
            </Alert>
          )}

          {status === "maxPunch" && <Alert severity="warning">{errorMessage}</Alert>}
          {status === "error" && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <LoadingButton onClick={handleClose} variant="text" color="inherit">
          Fechar
        </LoadingButton>
        <LoadingButton
          variant="contained"
          loading={status === "loading"}
          disabled={!password.trim() || status === "success" || status === "maxPunch"}
          onClick={() => void registerPoint(user?.id)}
        >
          Registrar ponto
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
