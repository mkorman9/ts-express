import config from './config';

const externalUrl = config.templates?.externalUrl || 'http://localhost:3000';

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
