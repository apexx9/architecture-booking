import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("About Renove");

const Page = () => {
  return <MarketingPageStub title="About Renove" />;
};

export default Page;
