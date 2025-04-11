import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0066ff" }, // Blue primary color
    secondary: { main: "#ff6b6b" }, // Red secondary color
    background: { default: "#f4f4f9" },
  },
  typography: {
    fontFamily: "Poppins, Arial, sans-serif",
    h4: { fontWeight: 600 },
    body2: { color: "#555" },
  },
});

export default theme;
