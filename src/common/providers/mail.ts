import log from './logging';

export type Language =
  'en-US' |
  'pl-PL';

interface MailProps {
  to: string[];
  template: string;
  language: Language;
  options?: unknown;
}

type MailBackend = (props: MailProps) => Promise<void>;

const fakeMailBackend: MailBackend = async (props: MailProps) => {
  log.info(`sending fake e-mail: to = ${props.to}, template = ${props.template}, language = ${props.language}, options = ${JSON.stringify(props.options)}`);
};

const mailBackend = fakeMailBackend;

export const sendMail = async (props: MailProps) => {
  try {
    await mailBackend(props);
  } catch (err) {
    log.error(`error while sending e-mail (to = ${props.to}, template = ${props.template}, language = ${props.language}, options = ${JSON.stringify(props.options)}): ${err}`);
    throw err;
  }
};
