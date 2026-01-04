export function calculateEMAs(values: number[], period: number): (number | null)[] {
  if (values.length === 0) return [];

  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let ema = values[0];

  result.push(ema);

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }

  return result;
}
