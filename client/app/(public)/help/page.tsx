import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Help centre");

const Page = () => {
  return <MarketingPageStub title="Help centre" />;
};

export default Page;
