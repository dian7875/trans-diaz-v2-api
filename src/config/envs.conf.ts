import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  CORS_ORIGINS: string[];
  STATE: string;
  JWT_SECRET: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    CORS_ORIGINS: joi.string().required(),
    STATE: joi.string().default('DEV'),
    JWT_SECRET: joi.string().default('DEVSECRET'),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
});

if (error) {
  throw new Error(`Config validation error: ${error.message} `);
}

const envVars: EnvVars = {
  PORT: value.PORT,
  CORS_ORIGINS: value.CORS_ORIGINS.split(',').map((origin: string) =>
    origin.trim(),
  ),
  STATE: value.STATE,
  JWT_SECRET: value.JWT_SECRET,
};

export const envs = {
  port: envVars.PORT,
  cors_origins: envVars.CORS_ORIGINS,
  state: envVars.STATE,
  jwt_secrets: envVars.JWT_SECRET,
};
