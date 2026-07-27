export const colors = {
  primary: "#0B3D2E",
  primaryLight: "#14805C",
  accent: "#F0A500",
  bg: "#F4F6F5",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E3E7E5",
  danger: "#C0392B",
  success: "#1E8E5A",
  received: "#2D6CDF",
};

// SO Request statuses: Received (new), Served (fulfilled), Cancelled.
export const statusColor = (status) => {
  switch (status) {
    case "Received":
      return colors.received;
    case "Served":
      return colors.success;
    case "Cancelled":
      return colors.danger;
    default:
      return colors.muted;
  }
};
