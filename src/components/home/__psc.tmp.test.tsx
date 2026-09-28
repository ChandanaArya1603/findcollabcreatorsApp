import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/hooks/useProfileCompletion", () => ({
  STEP_KEYS: ["basic", "photo", "social", "commercials", "projects"],
  useProfileCompletion: () => ({
    steps: { basic: true, photo: false, social: false, commercials: false, projects: false },
    percent: 20,
    ready: true,
    rewardCredits: 10,
  }),
}));

import ProfileStrengthCard from "./ProfileStrengthCard";

describe("ProfileStrengthCard collapse", () => {
  it("starts expanded and collapses on toggle", () => {
    render(<ProfileStrengthCard onOpenStep={() => {}} />);
    expect(screen.getByText("Profile strength")).toBeInTheDocument();
    expect(screen.getByText("Add past projects")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Collapse profile strength" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);

    expect(screen.queryByText("Add past projects")).not.toBeInTheDocument();
    expect(screen.queryByText("Finish to earn +10 credits instantly, and rank higher in brand searches")).not.toBeInTheDocument();
    expect(screen.getByText("Profile strength")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();

    const expand = screen.getByRole("button", { name: "Expand profile strength" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand);
    expect(screen.getByText("Add past projects")).toBeInTheDocument();
  });
});
