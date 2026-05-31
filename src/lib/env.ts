declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_URL: string;
      LIVEKIT_API_KEY: string;
      LIVEKIT_API_SECRET: string;
      LIVEKIT_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_LIVEKIT_URL?: string;

      // S3 Storage Configuration (optional)
      S3_ENDPOINT?: string;
      S3_REGION?: string;
      S3_ACCESS_KEY_ID?: string;
      S3_SECRET_ACCESS_KEY?: string;
      S3_BUCKET?: string;
      S3_PUBLIC_URL?: string;
    }
  }
}

export {};
