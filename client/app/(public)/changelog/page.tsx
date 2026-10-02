import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Changelog");

const Page = () => {
  return <MarketingPageStub title="Changelog" />;
};

export default Page;
