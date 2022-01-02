import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import config from './config';

export type Language =
  'en-US' |
  'pl-PL';

const loader = new TwingLoaderFilesystem(`./templates`);
const twing = new TwingEnvironment(loader);

const externalUrl = config.templates?.externalUrl || 'http://localhost:3000';

export const resolveTemplate = async (name: string, language: Language, props: unknown = {}) => {
  return await twing.render(`${language}/${name}`, props);
};

export const buildExternalEndpointPath = (endpoint: string): string => {
  return `${externalUrl}${endpoint}`;
};
