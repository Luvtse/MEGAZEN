import {z} from "zod";
const schema=z.object({NODE_ENV:z.enum(["development","test","production"]).default("development"),PORT:z.coerce.number().int().positive().default(4000),WEB_URL:z.string().url().default("http://localhost:3000"),DATABASE_URL:z.string().min(1),REDIS_URL:z.string().min(1),JWT_SECRET:z.string().min(32),LOG_LEVEL:z.string().default("info")});
export type AppConfig=z.infer<typeof schema>;
export const loadConfig=(env:NodeJS.ProcessEnv=process.env):AppConfig=>schema.parse(env);
