import { useQuery } from "@tanstack/react-query";
import { creditService, toNum } from "@/services/creditService";

/** Real per-campaign apply cost from /campaign_credit_cost (credit_cost). */
export const useCampaignCost = (campaignId: number | string | undefined) =>
  useQuery({
    queryKey: ["campaign_credit_cost", Number(campaignId)],
    queryFn: () => creditService.getCampaignCost(campaignId as number),
    enabled: campaignId != null && campaignId !== "",
    staleTime: 10 * 60 * 1000,
    select: (d: any) => ({
      ...d,
      cost: d?.credit_cost != null ? toNum(d.credit_cost) : d?.credits_required != null ? toNum(d.credits_required) : null,
    }),
  });

/** Boost settings from /credit_costs actions[action === "proposal_boost"]. */
export const getBoostAction = (costs: any) => {
  const a = (costs?.actions || []).find((x: any) => x?.action === "proposal_boost");
  return {
    enabled: Boolean(a?.enabled),
    min: toNum(a?.min, 1),
    max: toNum(a?.max, 0),
  };
};
