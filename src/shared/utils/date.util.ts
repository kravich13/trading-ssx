import { DateTime } from 'luxon';

export const normalizeDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';

  const formats = [
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd',
    'dd.MM.yyyy HH:mm:ss',
    'dd.MM.yyyy',
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd',
  ];

  for (const format of formats) {
    const dt = DateTime.fromFormat(dateStr, format);

    if (dt.isValid) {
      return dt.toFormat('yyyy-MM-dd');
    }
  }

  const isoDt = DateTime.fromISO(dateStr);

  if (isoDt.isValid) {
    return isoDt.toFormat('yyyy-MM-dd');
  }

  return dateStr.split(/[ T]/)[0];
};

export const formatDate = (dateStr: string | null | undefined, format = 'dd.MM.yyyy'): string => {
  if (!dateStr) return '-';

  // Try common formats
  const formats = ['yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd', 'dd.MM.yyyy HH:mm:ss', 'dd.MM.yyyy'];

  for (const f of formats) {
    const dt = DateTime.fromFormat(dateStr, f);
    if (dt.isValid) return dt.toFormat(format);
  }

  const isoDt = DateTime.fromISO(dateStr.replace(' ', 'T'));
  if (isoDt.isValid) return isoDt.toFormat(format);

  return dateStr;
};
