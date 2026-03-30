import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link as RouterLink } from "react-router-dom";
import { useMemo, useState } from "react";
import { useConfig } from "../../hooks/useConfig";

const isValidIPv4 = (value: string) => {
  const regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return regex.test(value);
};

const isValidPort = (value: string) => {
  if (!/^\d+$/.test(value)) return false;
  const port = Number(value);
  return port >= 1 && port <= 65535;
};

export const ConfigPage = () => {
  const { ip, port, setIp, setPort, loading, saving, saveConfig } = useConfig();
  const [snack, setSnack] = useState<{ open: boolean; type: "success" | "error"; message: string }>({
    open: false,
    type: "success",
    message: "",
  });

  const ipError = useMemo(() => (ip.length > 0 && !isValidIPv4(ip) ? "Digite um IPv4 valido." : ""), [ip]);
  const portError = useMemo(() => (port.length > 0 && !isValidPort(port) ? "Porta deve ser 1-65535." : ""), [port]);
  const isFormValid = isValidIPv4(ip) && isValidPort(port);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) {
      setSnack({ open: true, type: "error", message: "Corrija IP e porta antes de salvar." });
      return;
    }

    try {
      await saveConfig({ ip, port });
      setSnack({ open: true, type: "success", message: "Configuracoes salvas com sucesso." });
      window.location.reload();
    } catch {
      setSnack({ open: true, type: "error", message: "Nao foi possivel salvar as configuracoes." });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 }, height: "100%", overflow: "auto" }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton component={RouterLink} to="/" color="secondary">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h4">Configuracoes</Typography>
        </Box>

        {loading ? (
          <Stack spacing={1.5} alignItems="center" py={4}>
            <CircularProgress size={30} />
            <Typography color="text.secondary">Carregando configuracoes...</Typography>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="IP do servidor"
              value={ip}
              onChange={(e) => setIp(e.target.value.trim())}
              error={Boolean(ipError)}
              helperText={ipError || "Exemplo: 192.168.0.10"}
              fullWidth
            />

            <TextField
              label="Porta"
              value={port}
              onChange={(e) => setPort(e.target.value.trim())}
              error={Boolean(portError)}
              helperText={portError || "Exemplo: 8080"}
              fullWidth
            />

            <Button type="submit" variant="contained" disabled={!isFormValid || saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </Box>
        )}
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnack((prev) => ({ ...prev, open: false }))} severity={snack.type} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
