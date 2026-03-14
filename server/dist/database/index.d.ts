import * as schema from './schema';
export declare const db: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: import("better-sqlite3").Database;
};
export * from './schema';
