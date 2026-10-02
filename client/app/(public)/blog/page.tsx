import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Resources");

const Page = () => {
  return <MarketingPageStub title="Resources" />;
};

export default Page;
