import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import { Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import type { User } from "../../types/userType";

type UserCardProps = {
  user: User;
  onSelect: (user: User) => void;
};

export const UserCard = ({ user, onSelect }: UserCardProps) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardActionArea onClick={() => onSelect(user)} sx={{ p: 0.5 }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <AccountCircleRoundedIcon color="primary" />
              <Typography variant="h6" sx={{ fontSize: "1.05rem" }}>
                {user.name}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Empresa: {user.companny}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
