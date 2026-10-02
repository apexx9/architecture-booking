import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Privacy policy");

const Page = () => {
  return <MarketingPageStub title="Privacy policy" />;
};

export default Page;
