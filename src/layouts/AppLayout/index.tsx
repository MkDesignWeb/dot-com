import { Box } from "@mui/material";
import { TopBar } from "../../components/TopBar/TopBar";
import MainRoute from "../../routes/MainRoute";

export const AppLayout = () => {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <TopBar />
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <MainRoute />
      </Box>
    </Box>
  );
};
