import { MarketingPageStub, createMarketingMetadata } from "@/components/marketing/marketing-page-stub";

export const metadata = createMarketingMetadata("Contact");

const Page = () => {
  return <MarketingPageStub title="Contact" />;
};

export default Page;
