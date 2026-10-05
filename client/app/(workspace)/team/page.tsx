"use client";

import PageHeader from "@/components/workspace/page-header";
import TeamMembers from "@/components/tenant/team-members";

const TeamPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 py-8 lg:px-10">
      <PageHeader
        title="Team"
        description="Who has access to this practice, and what they can do."
      />

      <TeamMembers />
    </div>
  );
};

export default TeamPage;
