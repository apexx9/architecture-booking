import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Data processing");

const Page = () => {
  return <MarketingPageStub title="Data processing" />;
};

export default Page;
