export const config = {
  botToken: process.env.BOT_TOKEN || "",
  attioApiKey: process.env.ATTIO_API_KEY || "",
  upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  nodeEnv: process.env.NODE_ENV || "development",
  
  attio: {
    baseUrl: "https://api.attio.com/v2",
    companiesObject: "companies",
  },
  
  redis: {
    sessionTTL: 300, // 5 minutes
    recentCompaniesTTL: 60 * 60 * 24 * 30, // 30 days
    maxRecentCompanies: 10,
  },
  
  conversation: {
    timeoutMinutes: 5,
    maxSearchResults: 5,
  },
} as const;

export function validateConfig() {
  const required = {
    BOT_TOKEN: config.botToken,
    ATTIO_API_KEY: config.attioApiKey,
    UPSTASH_REDIS_REST_URL: config.upstashRedisUrl,
    UPSTASH_REDIS_REST_TOKEN: config.upstashRedisToken,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
