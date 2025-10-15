import * as React from "react";
import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.grey[800],
    }),
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: "#1a90ff",
    ...theme.applyStyles("dark", {
      backgroundColor: "#308fe8",
    }),
  },
}));

export default function CustomizedProgressBars({progress}) {
  return (
    <Stack spacing={2} sx={{ flexGrow: 1, width:"80%" }}>
      <BorderLinearProgress variant="determinate" value={progress} />
    </Stack>
  );
}
