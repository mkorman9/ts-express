import { resolveTemplate } from './templates';
import { log } from './logging';
import type { Language } from './templates';

interface MailProps {
  template: string;
  language: Language;
  props?: unknown;
}

type MailBackend = (subjects: string[], props: MailProps) => Promise<void>;

const fakeMailBackend: MailBackend = async (subjects: string[], props: MailProps) => {
  const content = await resolveTemplate(props.template, props.language, props.props);
  log.info(`Sending fake e-mail to ${subjects}:\n${content}`);
};

const mailBackend = fakeMailBackend;

export const sendMail = async (subjects: string[], props: MailProps) => {
  try {
    await mailBackend(subjects, props);
  } catch (err) {
    log.error(`Error while sending e-mail (subjects = ${subjects}, template = ${props.template}, language = ${props.language}): ${err}`);
    throw err;
  }
};
