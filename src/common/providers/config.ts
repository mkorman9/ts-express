import fs from 'fs';
import YAML from 'yaml';
import lodash from 'lodash';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const Mode = process.env.NODE_ENV || 'development';
const Version = process.env.npm_package_version || 'unknown';
const InTestMode = Mode === 'test';
const InDevMode = Mode === 'development';
const InProdMode = Mode === 'production';
const EnvironmentName = process.env.ENVIRONMENT_NAME || 'default';
const ConfigPath = process.env.CONFIG_PATH || './config.yml';
const SecretsPath = process.env.SECRETS_PATH || './secrets.yml';

const readConfig = () => {
  if (InTestMode) {
    return {};
  }

  try {
    const configContent = fs.readFileSync(ConfigPath, 'utf8');
    return YAML.parse(configContent);
  } catch (err) {
    throw new ConfigurationError(`Could not load config file from "${ConfigPath}"`);
  }
};

const readSecrets = () => {
  if (InTestMode) {
    return {};
  }

  try {
    const secretsContent = fs.readFileSync(SecretsPath, 'utf8');
    return YAML.parse(secretsContent);
  } catch (_) {
    // ignore
    return {};
  }
};

export default {
  mode: Mode,
  version: Version,
  inTestMode: InTestMode,
  inDevMode: InDevMode,
  inProdMode: InProdMode,
  environmentName: EnvironmentName,
  ...lodash.merge(readConfig(), readSecrets())
};
