import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Templates");

const Page = () => {
  return <MarketingPageStub title="Templates" />;
};

export default Page;
