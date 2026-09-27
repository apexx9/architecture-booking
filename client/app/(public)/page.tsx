import Hero from "@/components/landing/hero";
import OurServices from "@/components/landing/our-services";
import SampleProjects from "@/components/landing/sample-projects";
import Footer from "@/components/layout/footer";
import React from "react";

const Page = () => {
  return (
    <main className="relative flex flex-col">
      <Hero />
      <div className="bg-white rounded-24 py-23.5">
        <OurServices />
        <SampleProjects />
      </div>
    </main>
  );
};

export default Page;
