// Maps the server's application_status to a creator-friendly badge label.
// Unknown values (including null) are treated as "Applied".
export const applicationStatusLabel = (status?: string | null): string => {
  switch ((status || "").trim()) {
    case "Shortlisted":
      return "Shortlisted";
    case "Rejected":
      return "Not selected";
    case "Enlisted":
      return "Selected";
    case "Offer Created":
      return "Offer received";
    case "Offer Accepted":
      return "Offer accepted";
    case "Offer Rejected":
      return "Offer declined";
    case "Applied":
    default:
      return "Applied - awaiting review";
  }
};
