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

/**
 * Tempo que a confirmacao (ou o aviso de limite) fica na tela antes de fechar.
 * Subiu de 2s: ha o rotulo da marcacao para ler.
 */
const CONFIRMATION_MS = 6000;

export const ModalPoint = ({ modalOpen, setModalOpen, user }: ModalPointProps) => {
  const navigate = useNavigate();
  const { status, errorMessage, password, setPassword, confirmation, registerPoint, reset } = usePointRegistration();

  const handleClose = useCallback(() => {
    setModalOpen(false);
    reset();
  }, [reset, setModalOpen]);

  useEffect(() => {
    if (!modalOpen) return;

    // "inactive" fecha sozinho como os outros estados terminais: insistir na
    // senha nao muda o resultado, a guarda do servidor e a mesma.
    if (status === "success" || status === "maxPunch" || status === "inactive") {
      const timer = setTimeout(() => {
        handleClose();
        navigate("/");
      }, CONFIRMATION_MS);
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
              {confirmation?.message}
            </Alert>
          )}

          {(status === "maxPunch" || status === "inactive") && (
            <Alert severity="warning">{errorMessage}</Alert>
          )}
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
          disabled={
            !password.trim() ||
            status === "success" ||
            status === "maxPunch" ||
            status === "inactive"
          }
          onClick={() => void registerPoint(user?.id)}
        >
          Registrar ponto
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
