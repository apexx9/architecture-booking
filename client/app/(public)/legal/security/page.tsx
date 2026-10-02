import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Security");

const Page = () => {
  return <MarketingPageStub title="Security" />;
};

export default Page;
