import React, { useState, useEffect } from "react";
import { campaignService } from "@/services/campaignService";
import { isDemoUser } from "@/lib/demo";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { AppButton } from "../findcollab/AppButton";
import { Icon } from "../findcollab/Icon";
import { toast } from "sonner";
import type { Campaign } from "./CampaignsScreen";

interface Props {
  campaign: Campaign;
  onBack: () => void;
}

interface DetailField {
  icon: string;
  label: string;
  value: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}

const CampaignDetail: React.FC<Props> = ({ campaign: c, onBack }) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoUser()) {
      setLoading(false);
      return;
    }
    campaignService
      .getCampaignDetail(c.id)
      .then((res) => {
        console.log("📦 CampaignDetail API response:", JSON.stringify(res, null, 2));
        setDetail(res.campaign || res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [c.id]);

  const handleApply = async () => {
    if (isDemoUser()) {
      toast.success("Demo mode — application simulated!");
      setApplied(true);
      return;
    }
    setApplying(true);
    try {
      await campaignService.applyCampaign(c.id);
      toast.success("Campaign applied successfully!");
      setApplied(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  // Merge list data with fetched detail
  const d = detail || {};
  const title = d.project_title || c.title;
  const brand = d.company_name || c.brand;
  const brandName = d.brand_name || brand;
  const description = d.briefs || d.description || c.desc;
  const currencySymbol = d.currency_barter || d.currency_paid || "₹";
  const budgetValue = d.product_value || d.budget_min || d.fixed_value || "0";
  const budget = `${currencySymbol}${budgetValue}`;
  const credits = d.credits || c.credits || 10;
  const campaignType = d.campaign_type || c.type || "Barter";
  const country = d.country || "";
  const views = d.campaignViews || c.views || 0;
  const postedDate = d.timestamp ? timeAgo(d.timestamp) : c.days || "";

  // Keywords as tags
  const keywords = d.keywords || "";
  const tags: string[] = keywords
    ? keywords.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  // Additional fields from API
  const companyType = d.sign_up_type || "Brand";
  const ageRange = d.age_min && d.age_max ? `${d.age_min} - ${d.age_max}` : "";
  const followers = d.influencer_followers || "";
  const noOfInfluencers = d.no_of_influencer || "";
  const dosAndDonts = d.doanddont || "";
  const postType = d.post_type || "";
  const startDate = d.start_date || "";
  const endDate = d.end_date || "";

  // Deliverables: parse instagram/youtube/linkedin details
  const parseDeliverables = () => {
    const parts: string[] = [];
    try {
      const insta = d.instagram_details ? JSON.parse(d.instagram_details) : [];
      insta.forEach((item: any) => {
        if (item.instagram_values) parts.push(`Instagram: ${item.unitsinstagram}x ${item.instagram_values}`);
      });
    } catch {}
    try {
      const yt = d.youtube_details ? JSON.parse(d.youtube_details) : [];
      yt.forEach((item: any) => {
        if (item.youtube_values) parts.push(`YouTube: ${item.unitsyoutube}x ${item.youtube_values}`);
        else if (item.unitsyoutube) parts.push(`YouTube: ${item.unitsyoutube} unit(s)`);
      });
    } catch {}
    try {
      const li = d.linkedin_details ? JSON.parse(d.linkedin_details) : [];
      li.forEach((item: any) => {
        if (item.linkedin_values) parts.push(`LinkedIn: ${item.unitslinkedin}x ${item.linkedin_values}`);
        else if (item.unitslinkedin) parts.push(`LinkedIn: ${item.unitslinkedin} unit(s)`);
      });
    } catch {}
    return parts;
  };
  const deliverablesList = parseDeliverables();

  // Product link
  let productLinks: string[] = [];
  try {
    if (d.product_link) {
      const parsed = JSON.parse(d.product_link);
      productLinks = (Array.isArray(parsed) ? parsed : [parsed]).filter((l: string) => l && l.trim());
    }
  } catch {}

  // Platform detection from deliverables
  const platforms: string[] = [];
  if (d.instagram_details) {
    try { const p = JSON.parse(d.instagram_details); if (p.length) platforms.push("Instagram"); } catch {}
  }
  if (d.youtube_details) {
    try { const p = JSON.parse(d.youtube_details); if (p.length) platforms.push("YouTube"); } catch {}
  }
  if (d.linkedin_details) {
    try { const p = JSON.parse(d.linkedin_details); if (p.length) platforms.push("LinkedIn"); } catch {}
  }
  const platform = platforms.length > 0 ? platforms.join(", ") : c.plat || "Instagram";

  // About brand info
  const companyEmail = d.company_email || "";

  // Campaign images
  const campaignImages: string[] = d.campaignImages || [];

  const detailFields: DetailField[] = [
    { icon: "offer", label: "Company Type", value: companyType },
    { icon: "campaign", label: "Campaign Type", value: campaignType },
    ...(ageRange ? [{ icon: "person", label: "Age (years)", value: ageRange }] : []),
    ...(followers ? [{ icon: "eye", label: "Followers", value: followers }] : []),
    ...(noOfInfluencers ? [{ icon: "person", label: "No of Influencers", value: String(noOfInfluencers) }] : []),
    { icon: "startup", label: "Platform", value: platform },
    ...(postType ? [{ icon: "check", label: "Post Type", value: postType }] : []),
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <BackHeader title="Campaign Detail" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading campaign details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <BackHeader title="Campaign Detail" onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-primary-light via-card to-primary-light/40 px-5 pt-5 pb-4">
          <h1 className="text-xl font-black text-foreground leading-tight mb-2">{title}</h1>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-text-mid mb-3">
            {country && (
              <span className="flex items-center gap-1">
                <Icon name="home" size={13} className="text-primary" />
                {country}
              </span>
            )}
            {postedDate && (
              <span className="flex items-center gap-1">
                <Icon name="clock" size={13} className="text-primary" />
                {postedDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="eye" size={13} className="text-primary" />
              {views} Views
            </span>
          </div>

          {/* Tags / categories */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full border border-border bg-card text-[11px] font-medium text-text-mid"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Campaign images carousel */}
        {campaignImages.length > 0 && (
          <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
            {campaignImages.map((img: any, i: number) => {
              const src = typeof img === "string" ? img : img.image_url || img.url || "";
              return src ? (
                <img
                  key={i}
                  src={src}
                  alt={`Campaign ${i + 1}`}
                  className="h-32 rounded-xl object-cover shrink-0"
                />
              ) : null;
            })}
          </div>
        )}

        <div className="p-4 flex flex-col gap-3">
          {/* Detail grid - matching web layout */}
          <Card>
            <div className="grid grid-cols-2 gap-0">
              {detailFields.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-center gap-3 py-3.5 px-3 ${
                    i < detailFields.length - (detailFields.length % 2 === 0 ? 2 : 1)
                      ? "border-b border-border"
                      : ""
                  } ${i % 2 === 0 ? "border-r border-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    <Icon name={f.icon} size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-tight">{f.label}</p>
                    <p className="text-[11px] text-text-mid truncate">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Budget & Apply card */}
          <Card>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-foreground">{budget}</span>
            </div>
            <p className="text-xs text-text-mid mb-0.5">{campaignType}</p>
            <p className="text-xs text-primary font-bold mb-4">🪙 {credits} Credits Required</p>

            <AppButton
              full
              icon={applied ? "check" : "send"}
              onClick={handleApply}
              disabled={applying || applied}
            >
              {applied ? "Applied ✓" : applying ? "Applying…" : "Apply →"}
            </AppButton>
          </Card>

          {/* Description */}
          {description && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-2">Description</p>
              <p className="text-[13px] text-text-mid leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </Card>
          )}

          {/* Cities */}
          {cities && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-2">Cities</p>
              <p className="text-[13px] text-text-mid">{cities}</p>
            </Card>
          )}

          {/* Product */}
          {product && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-2">Product</p>
              <p className="text-[13px] text-foreground font-medium">{product}</p>
              {productUrl && (
                <a
                  href={productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-1 inline-block"
                >
                  {productUrl}
                </a>
              )}
            </Card>
          )}

          {/* Do's & Don'ts */}
          {dosAndDonts && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-2">Do's & Don'ts</p>
              <p className="text-[13px] text-text-mid leading-relaxed whitespace-pre-line">
                {dosAndDonts}
              </p>
            </Card>
          )}

          {/* Deliverables */}
          {deliverables && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-2">Deliverables</p>
              <p className="text-[13px] text-text-mid leading-relaxed whitespace-pre-line">
                {typeof deliverables === "string" ? deliverables : JSON.stringify(deliverables)}
              </p>
            </Card>
          )}

          {/* About brand */}
          {(contactName || brand) && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-3">About</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-sm font-black text-primary-dark">
                    {(contactName || brand || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{contactName || brand}</p>
                  {contactRole && (
                    <p className="text-[11px] text-text-mid">{contactRole}</p>
                  )}
                </div>
              </div>
              {(brandLocation || employees || brandCategory) && (
                <div className="flex gap-4 text-center">
                  {brandLocation && (
                    <div>
                      <p className="text-[10px] text-text-light uppercase">Location</p>
                      <p className="text-xs font-bold text-foreground">{brandLocation}</p>
                    </div>
                  )}
                  {employees && (
                    <div>
                      <p className="text-[10px] text-text-light uppercase">Employees</p>
                      <p className="text-xs font-bold text-foreground">{employees}</p>
                    </div>
                  )}
                  {brandCategory && (
                    <div>
                      <p className="text-[10px] text-text-light uppercase">Category</p>
                      <p className="text-xs font-bold text-foreground">{brandCategory}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Credit warning */}
          <Card className="!bg-warning-light !border-warning/20">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">⚡</span>
              </div>
              <div>
                <p className="text-xs text-warning font-bold mb-0.5">Insufficient Credits?</p>
                <p className="text-[12px] text-foreground">
                  You need <strong className="text-warning">{credits} credits</strong> to apply.
                  Make sure you have enough credits in your balance.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
};

export default CampaignDetail;
