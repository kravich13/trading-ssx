export const normalizeDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';

  const cleanDate = dateStr.split(/[ T]/)[0];

  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-');
    if (parts[0].length === 4) return cleanDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  if (cleanDate.includes('.')) {
    const parts = cleanDate.split('.');
    if (parts[0].length === 4) return parts.join('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return cleanDate;
};
