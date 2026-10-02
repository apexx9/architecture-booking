"use client";

import TeamCard from "@/components/tenant/team-card";

const TeamPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 py-8 lg:px-10">
      <header className="motion-enter">
        <h1 className="font-display text-[28px] font-light text-ink">Team</h1>
        <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
          Who has access to this practice, and what they can do.
        </p>
      </header>

      <TeamCard />
    </div>
  );
};

export default TeamPage;