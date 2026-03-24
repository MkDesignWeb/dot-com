import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { Link as RouterLink } from "react-router-dom";
import { useServerTime } from "../../hooks/useServerTime";

const formatDate = (date: Date) =>
  date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatClock = (date: Date) =>
  date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const TimePage = () => {
  const { status, time, retry } = useServerTime();

  return (
    <Box sx={{ position: "relative", minHeight: "100%", display: "grid", placeItems: "center" }}>
      <Tooltip title="Configuracoes">
        <IconButton
          component={RouterLink}
          to="/config"
          color="primary"
          sx={{ position: "absolute", top: 8, right: 8, bgcolor: "background.paper" }}
        >
          <SettingsRoundedIcon />
        </IconButton>
      </Tooltip>

      <Card sx={{ width: "min(820px, 100%)", borderRadius: 2, overflow: "visible" }}>
        <CardContent sx={{ py: { xs: 5, md: 7 }, px: { xs: 3, md: 6 } }}>
          <Stack spacing={4} alignItems="center">
            {status === "loading" ? (
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={34} />
                <Typography color="text.secondary">Sincronizando horario...</Typography>
              </Stack>
            ) : null}

            {status === "error" ? (
              <Stack spacing={2} sx={{ width: "100%", maxWidth: 540 }}>
                <Alert severity="error">Erro ao sincronizar o horario com o servidor.</Alert>
                <Button variant="contained" onClick={() => void retry()}>
                  Tentar novamente
                </Button>
              </Stack>
            ) : null}

            {status === "success" ? (
              <>
                <Stack spacing={1} alignItems="center">
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: { xs: "2.7rem", sm: "3.6rem", md: "5rem" },
                    }}
                  >
                    {formatClock(time)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                    {formatDate(time)}
                  </Typography>
                </Stack>

                <Button
                  component={RouterLink}
                  to="/pointRegister"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<AccessTimeRoundedIcon />}
                  sx={{ minWidth: 220, minHeight: 54 }}
                >
                  Registrar ponto
                </Button>
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
