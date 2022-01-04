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
  let url = externalUrl;
  if (url.endsWith('/')) {
    url = url.slice(0, url.length - 1);
  }

  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }

  return `${externalUrl}${endpoint}`;
};
