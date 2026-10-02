import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Careers");

const Page = () => {
  return <MarketingPageStub title="Careers" />;
};

export default Page;
