import { Redis } from "@upstash/redis";
import { config } from "../../lib/config.js";
import { logger } from "../../lib/logger.js";

export const redis = new Redis({
  url: config.upstashRedisUrl,
  token: config.upstashRedisToken,
});

export async function updateRecentCompanies(
  userId: number,
  companyId: string,
  companyName: string
): Promise<void> {
  const key = `recent_companies:${userId}`;
  
  try {
    const companyData = JSON.stringify({ id: companyId, name: companyName });
    
    await redis.zadd(key, { score: Date.now(), member: companyData });
    await redis.expire(key, config.redis.recentCompaniesTTL);
    await redis.zremrangebyrank(key, 0, -(config.redis.maxRecentCompanies + 1));
    
    logger.debug("Updated recent companies", { userId, companyId, companyName });
  } catch (error) {
    logger.error("Failed to update recent companies", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getRecentCompanies(userId: number): Promise<Array<{ id: string; name: string }>> {
  const key = `recent_companies:${userId}`;
  
  try {
    const results = await redis.zrange(key, 0, 4, { rev: true });
    
    if (!results || results.length === 0) {
      return [];
    }
    
    const companies = results
      .map((item) => {
        try {
          return JSON.parse(item as string);
        } catch {
          return null;
        }
      })
      .filter((item): item is { id: string; name: string } => item !== null);
    
    logger.debug("Retrieved recent companies", { userId, count: companies.length });
    return companies;
  } catch (error) {
    logger.error("Failed to get recent companies", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
