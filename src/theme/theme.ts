import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#00a651",
      light: "#4fd088",
      dark: "#00753a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0f6f3a",
      light: "#5a9e77",
      dark: "#0b4f2a",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f2f5f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#1d1f24",
      secondary: "#4f5765",
    },
    error: {
      main: "#d14343",
    },
    success: {
      main: "#1d7a42",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Segoe UI", "Segoe UI Variable", "Helvetica Neue", Arial, sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: 0.1,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 18px rgba(20, 30, 50, 0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 8px 22px rgba(20, 30, 50, 0.08)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});
