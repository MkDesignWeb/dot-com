import { Box } from "@mui/material";
import { TopBar } from "../../components/TopBar/TopBar";
import MainRoute from "../../routes/MainRoute";

export const AppLayout = () => {
  return (
    <Box sx={{ minHeight: "100vh", maxHeight: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <TopBar />
      <Box component="main" sx={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <MainRoute />
      </Box>
    </Box>
  );
};
