import { resolveTemplate } from './templates';
import { log } from './logging';
import type { Language } from './templates';

type MailBackend = (subjects: string[], content: string) => void;

const fakeMailBackend: MailBackend = async (subjects: string[], content: string) => {
  log.info(`Sending e-mail to ${subjects}: ${content}`);
};

const mailBackend = fakeMailBackend;

export const sendMail = async (subjects: string[], template: string, language: Language, props: unknown = {}) => {
  try {
    const content = await resolveTemplate(template, language, props);
    await mailBackend(subjects, content);
  } catch (err) {
    log.error(`Error while sending e-mail (subjects = ${subjects}, template = ${template}, language = ${language}): ${err}`);
    throw err;
  }
};
