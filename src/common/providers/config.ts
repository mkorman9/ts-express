import fs from 'fs';
import YAML from 'yaml';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const Mode = process.env.NODE_ENV || 'development';
const InTestMode = Mode === 'test';
const InDevMode = Mode === 'development';
const InProdMode = Mode === 'production';
const EnvironmentName = process.env.ENVIRONMENT_NAME || 'default';
const ConfigPath = process.env.CONFIG_PATH || './config.yml';

const readConfig = () => {
  if (InTestMode) {
    return {};
  }

  try {
    let configContent = fs.readFileSync(ConfigPath, 'utf8');
    configContent = configContent.replace(
      /\${file:(.+)}/,
      (_, path) => {
        try {
          return fs.readFileSync(path, 'utf8');
        } catch (err) {
          throw new ConfigurationError(`Could not replace mnemonic from config file. Could not load "${path}"`);
        }
      }
    );
    return YAML.parse(configContent);
  } catch (err) {
    if (err instanceof ConfigurationError) {
      throw err;
    }

    throw new ConfigurationError(`Could not load config file from "${ConfigPath}"`);
  }
};

const resolveVersion = () => {
  const envVersion = process.env.npm_package_version;
  if (envVersion) {
    return envVersion;
  }

  try {
    return fs.readFileSync('.version', 'utf8');
  } catch (err) {
    return 'unknown';
  }
};

export default {
  mode: Mode,
  version: resolveVersion(),
  inTestMode: InTestMode,
  inDevMode: InDevMode,
  inProdMode: InProdMode,
  environmentName: EnvironmentName,
  ...readConfig()
};
