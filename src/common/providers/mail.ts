import log from './logging';

export type Language =
  'en-US' |
  'pl-PL';

interface MailProps {
  template: string;
  language: Language;
  props?: unknown;
}

type MailBackend = (subjects: string[], props: MailProps) => Promise<void>;

const fakeMailBackend: MailBackend = async (subjects: string[], props: MailProps) => {
  log.info(`sending fake e-mail: subjects = ${subjects}, template = ${props.template}, language = ${props.language}, props = ${props.props}`);
};

const mailBackend = fakeMailBackend;

export const sendMail = async (subjects: string[], props: MailProps) => {
  try {
    await mailBackend(subjects, props);
  } catch (err) {
    log.error(`error while sending e-mail (subjects = ${subjects}, template = ${props.template}, language = ${props.language}): ${err}`);
    throw err;
  }
};
