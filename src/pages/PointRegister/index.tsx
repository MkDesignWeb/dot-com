import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link as RouterLink } from "react-router-dom";
import { useState } from "react";
import { ModalPoint } from "../../components/ModalPoint";
import { UserCard } from "../../components/UserCard";
import { useEmployees } from "../../hooks/useEmployees";
import type { User } from "../../types/userType";

export const PointRegister = () => {
  const { employees, loading, error, reload } = useEmployees();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Selecione o usuario
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Toque no seu nome para inserir a senha do ponto digital.
          </Typography>
        </Box>

        {loading ? (
          <Stack spacing={1.5} alignItems="center" py={6}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Carregando funcionarios...</Typography>
          </Stack>
        ) : null}

        {!loading && error ? (
          <Stack spacing={2}>
            <Alert severity="error">{error}</Alert>
            <Button variant="outlined" onClick={() => void reload()}>
              Tentar novamente
            </Button>
          </Stack>
        ) : null}

        {!loading && !error ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {employees.map((employee) => (
              <UserCard key={employee.id} user={employee} onSelect={handleSelectUser} />
            ))}
          </Box>
        ) : null}

        <Box>
          <Button component={RouterLink} to="/" startIcon={<ArrowBackRoundedIcon />} variant="text" color="secondary">
            Voltar
          </Button>
        </Box>
      </Stack>

      <ModalPoint user={selectedUser ?? undefined} modalOpen={modalOpen} setModalOpen={setModalOpen} />
    </Container>
  );
};
