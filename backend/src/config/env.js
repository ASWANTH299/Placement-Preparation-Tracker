require('dotenv').config();

const VALID_NODE_ENVS = ['development', 'test', 'production'];

const normalizeNodeEnv = (value) => {
  const normalized = (value || 'development').trim().toLowerCase();
  if (!VALID_NODE_ENVS.includes(normalized)) {
    throw new Error(
      `[env] Invalid NODE_ENV="${value}". Allowed values: ${VALID_NODE_ENVS.join(', ')}`
    );
  }
  return normalized;
};

const getMissingKeys = (requiredKeys) =>
  requiredKeys.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

const parsePositiveInteger = (rawValue, fallback, keyName) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`[env] ${keyName} must be a positive integer. Received: ${rawValue}`);
  }

  return parsed;
};

const validateAndBuildEnv = () => {
  const NODE_ENV = normalizeNodeEnv(process.env.NODE_ENV);

  const requiredKeys = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
  const missingKeys = getMissingKeys(requiredKeys);

  if (missingKeys.length > 0) {
    throw new Error(
      [
        '[env] Missing required environment variables:',
        ...missingKeys.map((key) => `  - ${key}`),
        '[env] Copy backend/.env.example to backend/.env and fill required values.',
      ].join('\n')
    );
  }

  if (String(process.env.JWT_SECRET).length < 32) {
    throw new Error('[env] JWT_SECRET must be at least 32 characters for secure token signing.');
  }

  return {
    NODE_ENV,
    PORT: parsePositiveInteger(process.env.PORT, 5000, 'PORT'),
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: String(process.env.FRONTEND_URL).replace(/\/$/, ''),
  };
};

const env = validateAndBuildEnv();

module.exports = {
  env,
};
