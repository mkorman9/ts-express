import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';

export type Language =
  'en-US' |
  'pl-PL';

const loader = new TwingLoaderFilesystem(`./templates`);
const twing = new TwingEnvironment(loader);

export const resolveTemplate = async (name: string, language: Language, props: unknown = {}) => {
  return await twing.render(`${language}/name`, props);
};
