import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Cookie policy");

const Page = () => {
  return <MarketingPageStub title="Cookie policy" />;
};

export default Page;
