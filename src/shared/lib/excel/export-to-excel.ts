import ExcelJS from 'exceljs';
import { Trade } from '@/entities/trade/types';

interface ExportData {
  trades: Trade[];
}

interface TradeDataRow {
  number: number;
  changesOfDepo: number | null;
  capitalInUsd: number;
  capitalInPercent: number;
  plPercent: number;
  plUsd: number;
  ticker: string;
  plUsdSigned: number;
  closedDate: string | null;
  defaultRisk: number | null;
}

function renderTradesTable({
  worksheet,
  dataRows,
  startRow,
  borderStyle,
}: {
  worksheet: ExcelJS.Worksheet;
  dataRows: TradeDataRow[];
  startRow: number;
  borderStyle: {
    top: { style: 'thin' };
    left: { style: 'thin' };
    bottom: { style: 'thin' };
    right: { style: 'thin' };
  };
}): void {
  for (let i = 1; i < startRow; i++) {
    worksheet.addRow([]);
  }

  worksheet.columns = [
    {},
    { width: 8 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
  ];

  const headerRow = worksheet.getRow(startRow);
  headerRow.getCell(2).value = '№';
  headerRow.getCell(3).value = 'Changes of CAPITAL';
  headerRow.getCell(4).value = 'CAPITAL in $';
  headerRow.getCell(5).value = 'CAPITAL in %';
  headerRow.getCell(6).value = 'PL%';
  headerRow.getCell(7).value = 'PL$';
  headerRow.getCell(8).value = 'TICKER';
  headerRow.getCell(9).value = 'PL$';
  headerRow.getCell(10).value = 'CLOSED DATE';
  headerRow.getCell(11).value = 'DEFAULT RISK%';

  for (let col = 2; col <= 11; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };
    cell.border = borderStyle;
  }

  dataRows.forEach((row, index) => {
    const rowNumber = startRow + 1 + index;
    const excelRow = worksheet.addRow([]);

    excelRow.getCell(2).value = row.number;
    excelRow.getCell(3).value = row.changesOfDepo;
    excelRow.getCell(8).value = row.ticker;
    excelRow.getCell(9).value = row.plUsdSigned;
    excelRow.getCell(10).value = row.closedDate;
    excelRow.getCell(11).value = row.defaultRisk;

    if (index === 0) {
      excelRow.getCell(4).value = row.capitalInUsd;
      excelRow.getCell(5).value = row.capitalInPercent / 100;
    } else {
      excelRow.getCell(4).value = {
        formula: `D${rowNumber - 1}+G${rowNumber - 1}+C${rowNumber}`,
      };
      excelRow.getCell(5).value = {
        formula: `E${rowNumber - 1}+F${rowNumber}`,
      };
    }

    excelRow.getCell(6).value = {
      formula: `I${rowNumber}/D${rowNumber}*1`,
    };
    excelRow.getCell(7).value = {
      formula: `D${rowNumber}*F${rowNumber}`,
    };

    excelRow.getCell(4).numFmt = '#,##0.00';
    excelRow.getCell(5).numFmt = '0.00%';
    excelRow.getCell(6).numFmt = '0.00%';
    excelRow.getCell(7).numFmt = '#,##0.00';
    excelRow.getCell(9).numFmt = '#,##0.00';
    if (row.changesOfDepo !== null) {
      excelRow.getCell(3).numFmt = '#,##0';
    }
    if (row.closedDate) {
      excelRow.getCell(10).value = row.closedDate;
    }
    if (row.defaultRisk !== null) {
      excelRow.getCell(11).numFmt = '0.00%';
    }

    for (let col = 2; col <= 11; col++) {
      excelRow.getCell(col).border = borderStyle;
    }
  });
}

function renderTradingMetrics({
  worksheet,
  borderStyle,
}: {
  worksheet: ExcelJS.Worksheet;
  borderStyle: {
    top: { style: 'thin' };
    left: { style: 'thin' };
    bottom: { style: 'thin' };
    right: { style: 'thin' };
  };
}): void {
  const greenFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FF90EE90' },
  };

  const row3 = worksheet.getRow(3);
  row3.getCell(3).value = 'Reward ratio';
  row3.getCell(3).fill = greenFill;
  row3.getCell(3).border = borderStyle;
  row3.getCell(4).value = {
    formula: 'N11/-(N12)',
  };
  row3.getCell(4).fill = greenFill;
  row3.getCell(4).border = borderStyle;

  const row4 = worksheet.getRow(4);
  row4.getCell(3).value = '% of depo in posit';
  row4.getCell(3).fill = greenFill;
  row4.getCell(3).border = borderStyle;
  row4.getCell(4).value = 5;
  row4.getCell(4).border = borderStyle;
  row4.getCell(5).value = {
    formula: 'ROUND(E11*D4/100, 2)',
  };
  row4.getCell(5).numFmt = '0.00';

  const row5 = worksheet.getRow(5);
  row5.getCell(3).value = '% of depo in nega';
  row5.getCell(3).fill = greenFill;
  row5.getCell(3).border = borderStyle;
  row5.getCell(4).value = -2;
  row5.getCell(4).border = borderStyle;
  row5.getCell(5).value = {
    formula: 'ROUND(D5*E11/100, 2)',
  };
  row5.getCell(5).numFmt = '0.00';
}

export async function exportGlobalTradesToExcel({ trades }: ExportData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Global Trades');

  const tradesByDate = new Map<string, typeof trades>();
  trades.forEach((trade) => {
    const date = trade.closed_date || 'no-date';
    if (!tradesByDate.has(date)) {
      tradesByDate.set(date, []);
    }
    tradesByDate.get(date)!.push(trade);
  });

  const dateTotals = new Map<string, number>();
  tradesByDate.forEach((tradesForDate, date) => {
    const totalChangeAmount = tradesForDate.reduce((sum, trade) => {
      let changeAmount = trade.total_pl_usd;
      if (trade.profits && trade.profits.length > 0) {
        changeAmount = trade.profits.reduce((s, p) => s + p, 0);
      }
      return sum + changeAmount;
    }, 0);
    dateTotals.set(date, totalChangeAmount);
  });

  const sortedByDate = [...trades].sort((a, b) => {
    const dateA = a.closed_date ? new Date(a.closed_date).getTime() : 0;
    const dateB = b.closed_date ? new Date(b.closed_date).getTime() : 0;
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    return a.id - b.id;
  });

  let actualInitialCapital = 0;
  if (sortedByDate.length > 0) {
    const firstTrade = sortedByDate[0];
    let firstChangeAmount = firstTrade.total_pl_usd;
    if (firstTrade.profits && firstTrade.profits.length > 0) {
      firstChangeAmount = firstTrade.profits.reduce((sum, p) => sum + p, 0);
    }
    actualInitialCapital = firstTrade.total_capital_after - firstChangeAmount;
  }

  const sortedTrades = [...trades].sort((a, b) => b.id - a.id).reverse();

  const dataRows: TradeDataRow[] = [];

  const oldestTradeId = sortedByDate[0]?.id;

  let lastDate = '';
  sortedTrades.forEach((trade, index) => {
    let changeAmount = trade.total_pl_usd;
    if (trade.profits && trade.profits.length > 0) {
      changeAmount = trade.profits.reduce((sum, p) => sum + p, 0);
    }

    const capitalInUsd = trade.total_capital_after;
    const capitalInPercent =
      actualInitialCapital > 0 ? (capitalInUsd / actualInitialCapital) * 100 : 100;

    const currentDate = trade.closed_date || 'no-date';
    const isFirstTradeOfDay = currentDate !== lastDate;
    const changesOfCapital = isFirstTradeOfDay ? dateTotals.get(currentDate) || null : null;

    const isOldestTrade = trade.id === oldestTradeId;

    const defaultRisk =
      trade.default_risk_percent !== null ? trade.default_risk_percent / 100 : null;

    if (isOldestTrade) {
      dataRows.push({
        number: index + 1,
        changesOfDepo: actualInitialCapital,
        capitalInUsd,
        capitalInPercent,
        plPercent: trade.pl_percent,
        plUsd: Math.abs(changeAmount),
        ticker: trade.ticker,
        plUsdSigned: changeAmount,
        closedDate: currentDate !== 'no-date' ? currentDate : null,
        defaultRisk,
      });
    } else {
      dataRows.push({
        number: index + 1,
        changesOfDepo: changesOfCapital,
        capitalInUsd,
        capitalInPercent,
        plPercent: trade.pl_percent,
        plUsd: Math.abs(changeAmount),
        ticker: trade.ticker,
        plUsdSigned: changeAmount,
        closedDate: currentDate !== 'no-date' ? currentDate : null,
        defaultRisk,
      });
    }

    lastDate = currentDate;
  });

  const startRow = 10;
  const borderStyle = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  };

  renderTradesTable({ worksheet, dataRows, startRow, borderStyle });
  renderTradingMetrics({ worksheet, borderStyle });

  // Chart data export - commented out for now
  // const chartDataCol = 13;
  // const chartDataStartRow = 1;

  // const equityChartData = dataRows.map((row, index) => ({
  //   x: index + 1,
  //   y: row.capitalInPercent / 100,
  // }));

  // worksheet.getCell(chartDataCol, chartDataStartRow).value = 'Trade #';
  // worksheet.getCell(chartDataCol + 1, chartDataStartRow).value = 'Capital %';

  // equityChartData.forEach((data, index) => {
  //   const row = chartDataStartRow + 1 + index;
  //   worksheet.getCell(chartDataCol, row).value = data.x;
  //   worksheet.getCell(chartDataCol + 1, row).value = data.y;
  //   worksheet.getCell(chartDataCol + 1, row).numFmt = '0.00%';
  // });

  // const plPercentages = dataRows.map((row) => row.plPercent);
  // const binSize = 1.0;
  // const bins: { [key: string]: number } = {};

  // plPercentages.forEach((pl) => {
  //   const binKey = Math.floor(pl / binSize) * binSize;
  //   bins[binKey] = (bins[binKey] || 0) + 1;
  // });

  // const histogramData = Object.entries(bins)
  //   .map(([key, count]) => ({
  //     bin: parseFloat(key),
  //     count,
  //   }))
  //   .sort((a, b) => a.bin - b.bin);

  // const galtonDataCol = chartDataCol;
  // const galtonDataStartRow = chartDataStartRow + equityChartData.length + 5;

  // worksheet.getCell(galtonDataCol, galtonDataStartRow).value = 'PL% Range';
  // worksheet.getCell(galtonDataCol + 1, galtonDataStartRow).value = 'Frequency';

  // histogramData.forEach((data, index) => {
  //   const row = galtonDataStartRow + 1 + index;
  //   worksheet.getCell(galtonDataCol, row).value =
  //     `[${data.bin.toFixed(2)}%, ${(data.bin + binSize).toFixed(2)}%]`;
  //   worksheet.getCell(galtonDataCol + 1, row).value = data.count;
  // });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `global-trades-export-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
