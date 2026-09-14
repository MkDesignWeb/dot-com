import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { appTheme } from "./theme/theme";
import { startDeviceHeartbeat } from "./services/deviceHeartbeat";
import "./styles/global.scss";


/**
 * Fora da arvore React de proposito: o anuncio ao servidor nao pertence a
 * nenhuma tela e nao deve parar ao trocar de rota, nem ser remontado pelo
 * StrictMode. A funcao e idempotente e nunca lanca — se o servidor estiver
 * fora do ar, ela apenas tenta de novo mais tarde.
 */
startDeviceHeartbeat();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
