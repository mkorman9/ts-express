import fs from 'fs';
import YAML from 'yaml';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const Mode = process.env.NODE_ENV || 'development';
const InTestingMode = Mode === 'testing';
const ConfigPath = process.env.CONFIG_PATH || './config.yml';

const readConfig = () => {
  if (InTestingMode) {
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

export default {
  mode: Mode,
  testing: InTestingMode,
  ...readConfig()
};