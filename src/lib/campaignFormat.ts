// Shared formatters for campaign data (budget, type)

export function formatCampaignType(raw: any): string {
  const t = (raw || "barter").toString().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const fmt = (n: any) => {
  const num = Number(n);
  return isNaN(num) ? String(n) : num.toLocaleString();
};

/**
 * Format the budget for a campaign based on its type.
 * Accepts the raw API campaign object (any shape across endpoints).
 */
export function formatCampaignBudget(c: any): string {
  const rawType = (c.campaign_type || c.type || "barter").toString().toLowerCase();

  if (rawType === "paid") {
    const cur = c.currency_paid || "₹";
    if (c.budget_min && c.budget_max) return `${cur}${fmt(c.budget_min)} - ${cur}${fmt(c.budget_max)}`;
    if (c.budget_max) return `${cur}${fmt(c.budget_max)}`;
    if (c.budget_min) return `${cur}${fmt(c.budget_min)}`;
    return "—";
  }

  if (rawType === "barter") {
    const cur = c.currency_barter || "₹";
    if (c.product_value) return `${cur}${fmt(c.product_value)} value`;
    return "Barter";
  }

  if (rawType === "affiliate") {
    const cur = c.fixed || "₹";
    let out = "";
    if (c.fixed_value) out = `${cur}${fmt(c.fixed_value)}`;
    if (c.variable_value) out += `${out ? " + " : ""}${c.variable || cur}${fmt(c.variable_value)}`;
    return out || "—";
  }

  return "—";
}
