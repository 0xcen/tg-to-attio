import { StorageAdapter } from "grammy";
import { Redis } from "@upstash/redis";

/**
 * Custom storage adapter for Upstash Redis that properly handles JSON serialization
 * The @grammyjs/storage-redis adapter has issues with Upstash's REST API
 */
export class UpstashStorageAdapter<T> implements StorageAdapter<T> {
  constructor(private redis: Redis) {}

  async read(key: string): Promise<T | undefined> {
    try {
      const value = await this.redis.get(key);
      if (value === null || value === undefined) {
        return undefined;
      }
      // Upstash returns already-parsed JSON objects, not strings
      return value as T;
    } catch (error) {
      return undefined;
    }
  }

  async write(key: string, value: T): Promise<void> {
    try {
      // Upstash automatically serializes objects to JSON
      await this.redis.set(key, value);
    } catch (error) {
      // Silent fail - session will be recreated on next request
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      // Silent fail
    }
  }
}
