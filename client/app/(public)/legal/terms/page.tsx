import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Terms of service");

const Page = () => {
  return <MarketingPageStub title="Terms of service" />;
};

export default Page;
