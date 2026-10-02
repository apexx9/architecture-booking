import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("API documentation");

const Page = () => {
  return <MarketingPageStub title="API documentation" />;
};

export default Page;
