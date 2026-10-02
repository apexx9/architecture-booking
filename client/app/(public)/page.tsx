import Hero from "@/components/landing/hero";
import OurServices from "@/components/landing/our-services";
import SampleProjects from "@/components/landing/sample-projects";

/**
 * Single `<main>` landmark: the route group layout already provides it, so this
 * page renders sections only.
 */
const Page = () => {
  return (
    <div className="relative flex flex-col">
      <Hero />
      <div className="bg-white rounded-24 py-23.5">
        <OurServices />
        <SampleProjects />
      </div>
    </div>
  );
};

export default Page;
