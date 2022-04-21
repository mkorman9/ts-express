import dayjs from 'dayjs';

export const parseDate = (arg: unknown): (Date | null | undefined) => {
  if (arg === null) {
    return null;
  }

  if (typeof arg === 'string' || arg instanceof Date) {
    return dayjs(arg).toDate();
  }

  return undefined;
};
