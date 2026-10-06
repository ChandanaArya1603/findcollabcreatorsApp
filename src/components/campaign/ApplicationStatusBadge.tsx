import React from "react";
import { applicationStatusLabel } from "@/lib/applicationStatus";
import { Icon } from "../findcollab/Icon";

interface Props {
  status?: string | null;
  className?: string;
}

export const ApplicationStatusBadge: React.FC<Props> = ({ status, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-primary-light text-primary text-xs font-bold ${className}`}
  >
    <Icon name="check" size={13} className="text-primary" />
    {applicationStatusLabel(status)}
  </span>
);
