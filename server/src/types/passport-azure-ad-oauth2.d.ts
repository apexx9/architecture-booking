declare module 'passport-azure-ad-oauth2' {
  import { Strategy as OAuth2Strategy, StrategyOptions } from 'passport-oauth2';

  export interface AzureAdOAuth2StrategyOptions extends StrategyOptions {
    resource?: string;
    tenant?: string;
    useCommonEndpoint?: boolean;
  }

  export class Strategy extends OAuth2Strategy {
    constructor(options: AzureAdOAuth2StrategyOptions, verify: any);
  }

  export default Strategy;
}
