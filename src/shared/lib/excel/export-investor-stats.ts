import { calculateTotalDepositStats } from '@/entities/investor';
import { YearlyDepositStat } from '@/entities/investor/types';
import ExcelJS from 'exceljs';

const COLORS = {
  DARK_GREEN: 'FF2E7D32',
  LIGHT_GREEN: 'FFE8F5E9',
  LIGHTER_GREEN: 'FFF1F8E9',
  DARK_RED: 'FFC62828',
  LIGHT_GREY: 'FFF5F5F5',
} as const;

interface ExportInvestorStatsData {
  investorName: string;
  stats: YearlyDepositStat[];
}

export async function exportInvestorStatsToExcel({
  investorName,
  stats,
}: ExportInvestorStatsData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Quarterly Statistics');

  worksheet.columns = [
    { width: 12 },
    { width: 10 },
    { width: 15 },
    { width: 18 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
  ];

  const borderStyle = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  };

  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: COLORS.DARK_GREEN },
  };

  const yearFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: COLORS.LIGHT_GREEN },
  };

  const quarterFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: COLORS.LIGHTER_GREEN },
  };

  const profitColor = { argb: COLORS.DARK_GREEN };
  const lossColor = { argb: COLORS.DARK_RED };
  const headerTextColor = { argb: COLORS.LIGHT_GREY };

  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = `${investorName} - Quarterly Deposit Statistics`;
  titleRow.getCell(1).font = { bold: true };
  titleRow.getCell(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(1, 1, 1, 8);

  const headerRow = worksheet.getRow(3);
  const headers = [
    'Year',
    'Quarter',
    'Month',
    'Deposit Start ($)',
    'Deposit End ($)',
    'Growth ($)',
    'Growth (%)',
    'Trades',
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: headerTextColor };
    cell.fill = headerFill;
    cell.border = borderStyle;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let currentRow = 4;

  stats.forEach((yearStat) => {
    const yearHeaderRow = worksheet.getRow(currentRow);
    yearHeaderRow.getCell(1).value = `${yearStat.year}`;
    yearHeaderRow.getCell(1).font = { bold: true, color: headerTextColor };
    yearHeaderRow.getCell(1).fill = headerFill;
    yearHeaderRow.getCell(1).border = borderStyle;
    yearHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, 8);
    currentRow++;

    yearStat.quarters.forEach((quarterStat) => {
      quarterStat.months.forEach((monthStat, monthIndex) => {
        const row = worksheet.getRow(currentRow);

        if (monthIndex === 0) {
          row.getCell(2).value = `Q${quarterStat.quarter}`;
          row.getCell(2).fill = quarterFill;
          row.getCell(2).font = { bold: true };
          row.getCell(2).border = borderStyle;
          row.getCell(2).alignment = { vertical: 'middle' };
          worksheet.mergeCells(currentRow, 2, currentRow + quarterStat.months.length - 1, 2);
        }

        row.getCell(3).value = monthStat.monthName;
        row.getCell(3).border = borderStyle;
        row.getCell(3).alignment = { horizontal: 'center' };

        row.getCell(4).value = monthStat.depositStart;
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(4).border = borderStyle;
        row.getCell(4).alignment = { horizontal: 'right' };

        row.getCell(5).value = monthStat.depositEnd;
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(5).border = borderStyle;
        row.getCell(5).alignment = { horizontal: 'right' };

        row.getCell(6).value = monthStat.growthUsd;
        row.getCell(6).numFmt = '#,##0.00';
        row.getCell(6).border = borderStyle;
        row.getCell(6).alignment = { horizontal: 'right' };
        if (monthStat.growthUsd >= 0) {
          row.getCell(6).font = { color: profitColor, bold: true };
        } else {
          row.getCell(6).font = { color: lossColor, bold: true };
        }

        row.getCell(7).value = monthStat.growthPercent / 100;
        row.getCell(7).numFmt = '0.00%';
        row.getCell(7).border = borderStyle;
        row.getCell(7).alignment = { horizontal: 'right' };
        if (monthStat.growthPercent >= 0) {
          row.getCell(7).font = { color: profitColor, bold: true };
        } else {
          row.getCell(7).font = { color: lossColor, bold: true };
        }

        row.getCell(8).value = monthStat.tradesCount;
        row.getCell(8).border = borderStyle;
        row.getCell(8).alignment = { horizontal: 'center' };

        currentRow++;
      });

      const quarterSummaryRow = worksheet.getRow(currentRow);
      quarterSummaryRow.getCell(3).value = `Q${quarterStat.quarter} Total`;
      quarterSummaryRow.getCell(3).font = { bold: true };
      quarterSummaryRow.getCell(3).border = borderStyle;
      quarterSummaryRow.getCell(3).fill = quarterFill;

      quarterSummaryRow.getCell(4).value = quarterStat.depositStart;
      quarterSummaryRow.getCell(4).numFmt = '#,##0.00';
      quarterSummaryRow.getCell(4).border = borderStyle;
      quarterSummaryRow.getCell(4).fill = quarterFill;
      quarterSummaryRow.getCell(4).alignment = { horizontal: 'right' };

      quarterSummaryRow.getCell(5).value = quarterStat.depositEnd;
      quarterSummaryRow.getCell(5).numFmt = '#,##0.00';
      quarterSummaryRow.getCell(5).border = borderStyle;
      quarterSummaryRow.getCell(5).fill = quarterFill;
      quarterSummaryRow.getCell(5).alignment = { horizontal: 'right' };

      quarterSummaryRow.getCell(6).value = quarterStat.growthUsd;
      quarterSummaryRow.getCell(6).numFmt = '#,##0.00';
      quarterSummaryRow.getCell(6).border = borderStyle;
      quarterSummaryRow.getCell(6).fill = quarterFill;
      quarterSummaryRow.getCell(6).font = { bold: true };
      quarterSummaryRow.getCell(6).alignment = { horizontal: 'right' };
      if (quarterStat.growthUsd >= 0) {
        quarterSummaryRow.getCell(6).font = {
          ...quarterSummaryRow.getCell(6).font,
          color: profitColor,
        };
      } else {
        quarterSummaryRow.getCell(6).font = {
          ...quarterSummaryRow.getCell(6).font,
          color: lossColor,
        };
      }

      quarterSummaryRow.getCell(7).value = quarterStat.growthPercent / 100;
      quarterSummaryRow.getCell(7).numFmt = '0.00%';
      quarterSummaryRow.getCell(7).border = borderStyle;
      quarterSummaryRow.getCell(7).fill = quarterFill;
      quarterSummaryRow.getCell(7).font = { bold: true };
      quarterSummaryRow.getCell(7).alignment = { horizontal: 'right' };
      if (quarterStat.growthPercent >= 0) {
        quarterSummaryRow.getCell(7).font = {
          ...quarterSummaryRow.getCell(7).font,
          color: profitColor,
        };
      } else {
        quarterSummaryRow.getCell(7).font = {
          ...quarterSummaryRow.getCell(7).font,
          color: lossColor,
        };
      }

      quarterSummaryRow.getCell(8).value = quarterStat.tradesCount;
      quarterSummaryRow.getCell(8).border = borderStyle;
      quarterSummaryRow.getCell(8).fill = quarterFill;
      quarterSummaryRow.getCell(8).font = { bold: true };
      quarterSummaryRow.getCell(8).alignment = { horizontal: 'center' };

      currentRow++;
    });

    const yearSummaryRow = worksheet.getRow(currentRow);
    yearSummaryRow.getCell(1).value = `${yearStat.year} Total`;
    yearSummaryRow.getCell(1).font = { bold: true };
    yearSummaryRow.getCell(1).border = borderStyle;
    yearSummaryRow.getCell(1).fill = yearFill;
    yearSummaryRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells(currentRow, 1, currentRow, 2);

    yearSummaryRow.getCell(2).value = '';
    yearSummaryRow.getCell(2).border = borderStyle;
    yearSummaryRow.getCell(2).fill = yearFill;

    yearSummaryRow.getCell(3).value = '';
    yearSummaryRow.getCell(3).border = borderStyle;
    yearSummaryRow.getCell(3).fill = yearFill;

    yearSummaryRow.getCell(4).value = yearStat.depositStart;
    yearSummaryRow.getCell(4).numFmt = '#,##0.00';
    yearSummaryRow.getCell(4).border = borderStyle;
    yearSummaryRow.getCell(4).fill = yearFill;
    yearSummaryRow.getCell(4).font = { bold: true };
    yearSummaryRow.getCell(4).alignment = { horizontal: 'right' };

    yearSummaryRow.getCell(5).value = yearStat.depositEnd;
    yearSummaryRow.getCell(5).numFmt = '#,##0.00';
    yearSummaryRow.getCell(5).border = borderStyle;
    yearSummaryRow.getCell(5).fill = yearFill;
    yearSummaryRow.getCell(5).font = { bold: true };
    yearSummaryRow.getCell(5).alignment = { horizontal: 'right' };

    yearSummaryRow.getCell(6).value = yearStat.growthUsd;
    yearSummaryRow.getCell(6).numFmt = '#,##0.00';
    yearSummaryRow.getCell(6).border = borderStyle;
    yearSummaryRow.getCell(6).fill = yearFill;
    yearSummaryRow.getCell(6).font = { bold: true };
    yearSummaryRow.getCell(6).alignment = { horizontal: 'right' };
    if (yearStat.growthUsd >= 0) {
      yearSummaryRow.getCell(6).font = {
        ...yearSummaryRow.getCell(6).font,
        color: profitColor,
      };
    } else {
      yearSummaryRow.getCell(6).font = {
        ...yearSummaryRow.getCell(6).font,
        color: lossColor,
      };
    }

    yearSummaryRow.getCell(7).value = yearStat.growthPercent / 100;
    yearSummaryRow.getCell(7).numFmt = '0.00%';
    yearSummaryRow.getCell(7).border = borderStyle;
    yearSummaryRow.getCell(7).fill = yearFill;
    yearSummaryRow.getCell(7).font = { bold: true };
    yearSummaryRow.getCell(7).alignment = { horizontal: 'right' };
    if (yearStat.growthPercent >= 0) {
      yearSummaryRow.getCell(7).font = {
        ...yearSummaryRow.getCell(7).font,
        color: profitColor,
      };
    } else {
      yearSummaryRow.getCell(7).font = {
        ...yearSummaryRow.getCell(7).font,
        color: lossColor,
      };
    }

    yearSummaryRow.getCell(8).value = yearStat.tradesCount;
    yearSummaryRow.getCell(8).border = borderStyle;
    yearSummaryRow.getCell(8).fill = yearFill;
    yearSummaryRow.getCell(8).font = { bold: true };
    yearSummaryRow.getCell(8).alignment = { horizontal: 'center' };

    currentRow += 2;
  });

  const totalStats = calculateTotalDepositStats(stats);

  worksheet.getColumn(10).width = 20;
  worksheet.getColumn(11).width = 20;

  const summaryStartRow = 3;
  const summaryLabelFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: COLORS.DARK_GREEN },
  };

  const summaryValueFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: COLORS.LIGHT_GREEN },
  };

  const summaryHeaderRow = worksheet.getRow(summaryStartRow);
  summaryHeaderRow.getCell(10).value = 'Total Statistics';
  summaryHeaderRow.getCell(10).font = { bold: true, color: headerTextColor, size: 12 };
  summaryHeaderRow.getCell(10).fill = summaryLabelFill;
  summaryHeaderRow.getCell(10).border = borderStyle;
  summaryHeaderRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(summaryStartRow, 10, summaryStartRow, 11);

  const totalProfitLabelRow = worksheet.getRow(summaryStartRow + 1);
  totalProfitLabelRow.getCell(10).value = 'Total Profit ($)';
  totalProfitLabelRow.getCell(10).font = { bold: true, color: headerTextColor };
  totalProfitLabelRow.getCell(10).fill = summaryLabelFill;
  totalProfitLabelRow.getCell(10).border = borderStyle;
  totalProfitLabelRow.getCell(10).alignment = { horizontal: 'left', vertical: 'middle' };

  totalProfitLabelRow.getCell(11).value = totalStats.totalGrowthUsd;
  totalProfitLabelRow.getCell(11).numFmt = '#,##0.00';
  totalProfitLabelRow.getCell(11).font = { bold: true, size: 12 };
  totalProfitLabelRow.getCell(11).fill = summaryValueFill;
  totalProfitLabelRow.getCell(11).border = borderStyle;
  totalProfitLabelRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
  if (totalStats.totalGrowthUsd >= 0) {
    totalProfitLabelRow.getCell(11).font = {
      ...totalProfitLabelRow.getCell(11).font,
      color: profitColor,
    };
  } else {
    totalProfitLabelRow.getCell(11).font = {
      ...totalProfitLabelRow.getCell(11).font,
      color: lossColor,
    };
  }

  const totalPercentLabelRow = worksheet.getRow(summaryStartRow + 2);
  totalPercentLabelRow.getCell(10).value = 'Total Growth (%)';
  totalPercentLabelRow.getCell(10).font = { bold: true, color: headerTextColor };
  totalPercentLabelRow.getCell(10).fill = summaryLabelFill;
  totalPercentLabelRow.getCell(10).border = borderStyle;
  totalPercentLabelRow.getCell(10).alignment = { horizontal: 'left', vertical: 'middle' };

  totalPercentLabelRow.getCell(11).value = totalStats.totalGrowthPercent / 100;
  totalPercentLabelRow.getCell(11).numFmt = '0.00%';
  totalPercentLabelRow.getCell(11).font = { bold: true, size: 12 };
  totalPercentLabelRow.getCell(11).fill = summaryValueFill;
  totalPercentLabelRow.getCell(11).border = borderStyle;
  totalPercentLabelRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
  if (totalStats.totalGrowthPercent >= 0) {
    totalPercentLabelRow.getCell(11).font = {
      ...totalPercentLabelRow.getCell(11).font,
      color: profitColor,
    };
  } else {
    totalPercentLabelRow.getCell(11).font = {
      ...totalPercentLabelRow.getCell(11).font,
      color: lossColor,
    };
  }

  const initialDepositRow = worksheet.getRow(summaryStartRow + 3);
  initialDepositRow.getCell(10).value = 'Initial Deposit ($)';
  initialDepositRow.getCell(10).font = { bold: true, color: headerTextColor };
  initialDepositRow.getCell(10).fill = summaryLabelFill;
  initialDepositRow.getCell(10).border = borderStyle;
  initialDepositRow.getCell(10).alignment = { horizontal: 'left', vertical: 'middle' };

  initialDepositRow.getCell(11).value = totalStats.initialDeposit;
  initialDepositRow.getCell(11).numFmt = '#,##0.00';
  initialDepositRow.getCell(11).font = { bold: true };
  initialDepositRow.getCell(11).fill = summaryValueFill;
  initialDepositRow.getCell(11).border = borderStyle;
  initialDepositRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };

  const finalDepositRow = worksheet.getRow(summaryStartRow + 4);
  finalDepositRow.getCell(10).value = 'Final Deposit ($)';
  finalDepositRow.getCell(10).font = { bold: true, color: headerTextColor };
  finalDepositRow.getCell(10).fill = summaryLabelFill;
  finalDepositRow.getCell(10).border = borderStyle;
  finalDepositRow.getCell(10).alignment = { horizontal: 'left', vertical: 'middle' };

  finalDepositRow.getCell(11).value = totalStats.finalDeposit;
  finalDepositRow.getCell(11).numFmt = '#,##0.00';
  finalDepositRow.getCell(11).font = { bold: true };
  finalDepositRow.getCell(11).fill = summaryValueFill;
  finalDepositRow.getCell(11).border = borderStyle;
  finalDepositRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedName = investorName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${sanitizedName}-quarterly-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
