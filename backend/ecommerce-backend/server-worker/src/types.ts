export type Env = {
    DATABASE_URL: string;
    PRODUCTS_DATABASE_URL: string;
    RSA_PRIVATE_KEY_PEM: string;
    RSA_PUBLIC_KEY_PEM: string;
    RESEND_API_KEY: string;
    JWT_SECRET: string;
    ASSETS?: Fetcher;
    CLOUDFLARE_PAGES_DEPLOY_HOOK?: string;
    BUILD_WEBHOOK_URL?: string;
    CLOUDFLARE_API_TOKEN?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_PAGES_PROJECT_NAME?: string;
};
