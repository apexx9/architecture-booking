import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Pricing");

const Page = () => {
  return <MarketingPageStub title="Pricing" />;
};

export default Page;
