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
import SyncProblemRoundedIcon from "@mui/icons-material/SyncProblemRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { Link as RouterLink } from "react-router-dom";
import { useServerTime } from "../../hooks/useServerTime";
import { formatBusinessClock, formatBusinessLongDate } from "../../utils/timezone";
import { describeTimeSource, formatUtcClock } from "../../utils/timeSource";


export const TimePage = () => {
  const { status, isOutOfSync, time, timeSource, retry } = useServerTime();

  const sourceLabel = describeTimeSource(timeSource, { isOutOfSync });

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100%",
        width: "100%",
        display: "grid",
        placeItems: "center",
      }}
    >
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
                <Alert severity="error">
                  Nao foi possivel sincronizar o horario com o servidor. Verifique a conexao e o
                  endereco em Configuracoes.
                </Alert>
                <Button variant="contained" onClick={() => void retry()}>
                  Tentar novamente
                </Button>
              </Stack>
            ) : null}

            {status === "success" ? (
              <>
                <Stack spacing={1} alignItems="center">
                  {/* Procedencia ACIMA do relogio: quem olha para a hora precisa
                      saber, no mesmo relance, se aquele numero e o oficial. */}
                  <Tooltip title={sourceLabel.detail}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {sourceLabel.warning ? (
                        <SyncProblemRoundedIcon fontSize="small" color="warning" />
                      ) : (
                        <VerifiedRoundedIcon fontSize="small" color="success" />
                      )}
                      <Typography
                        component="span"
                        variant="caption"
                        color={sourceLabel.warning ? "warning.main" : "text.secondary"}
                        sx={{ letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}
                      >
                        {sourceLabel.text}
                      </Typography>
                    </Stack>
                  </Tooltip>

                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: { xs: "2.7rem", sm: "3.6rem", md: "5rem" },
                    }}
                  >
                    {formatBusinessClock(time)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                    {formatBusinessLongDate(time)}
                  </Typography>

                  {/* A mesma hora na referencia mundial. Serve de conferencia
                      quando alguem contesta o horario: UTC nao tem horario de
                      verao nem depende do fuso configurado na maquina. */}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatUtcClock(time)}
                  </Typography>

                  {/* Perder a sincronia nao apaga o relogio: ele continua contando
                      com o ultimo desvio medido enquanto tenta reconectar. O aviso
                      fica no rotulo acima do relogio — repeti-lo aqui embaixo dizia
                      a mesma coisa duas vezes. */}
                </Stack>

                <Stack spacing={1} alignItems="center">
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
                  {isOutOfSync ? (
                    <Typography variant="body2" color="text.secondary">
                      Sem o servidor a batida nao sera registrada.
                    </Typography>
                  ) : null}
                </Stack>
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
