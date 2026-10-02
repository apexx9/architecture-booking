import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Guides");

const Page = () => {
  return <MarketingPageStub title="Guides" />;
};

export default Page;
