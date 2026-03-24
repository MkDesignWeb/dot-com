import { useEffect, useState } from "react";
import { Box, IconButton, Stack, Typography, useTheme } from "@mui/material";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import FilterNoneRoundedIcon from "@mui/icons-material/FilterNoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export const TopBar = () => {
  const theme = useTheme();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.api?.window) return;

    const check = async () => {
      try {
        const maximized = await window.api.window.isMaximized();
        setIsMaximized(maximized);
      } catch {
        setIsMaximized(false);
      }
    };

    void check();

    const removeMaximizeListener = window.api.window.onMaximize(() => setIsMaximized(true));
    const removeUnmaximizeListener = window.api.window.onUnmaximize(() => setIsMaximized(false));

    return () => {
      removeMaximizeListener();
      removeUnmaximizeListener();
    };
  }, []);

  const handleMinimize = () => {
    void window.api?.window?.minimize();
  };

  const handleMaximize = () => {
    if (!window.api?.window) return;

    if (isMaximized) {
      void window.api.window.unmaximize();
      return;
    }

    void window.api.window.maximize();
  };

  const handleClose = () => {
    void window.api?.window?.close();
  };

  return (
    <Box
      component="nav"
      sx={{
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: "primary.main",
        userSelect: "none",
      }}
    >
      <Typography
        sx={{
          px: 1.5,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.4,
          color: "text.primary",
          WebkitAppRegion: "drag",
          height: "100%",
          display: "flex",
          alignItems: "center",
          flex: 1,
        }}
      >
        DOT COM
      </Typography>

      <Stack direction="row" sx={{ WebkitAppRegion: "no-drag" }}>
        <IconButton onClick={handleMinimize} size="small" sx={{ borderRadius: 0, width: 46, height: 36 }}>
          <RemoveRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={handleMaximize} size="small" sx={{ borderRadius: 0, width: 46, height: 36 }}>
          {isMaximized ? <FilterNoneRoundedIcon fontSize="small" /> : <CheckBoxOutlineBlankRoundedIcon fontSize="small" />}
        </IconButton>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            borderRadius: 0,
            width: 46,
            height: 36,
            "&:hover": { bgcolor: "error.main", color: "error.contrastText" },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};
