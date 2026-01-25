import { Expense, ExpenseCategory } from '@/types/expense';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface ExportOptions {
  title?: string;
  includeDetails?: boolean;
  dateRange?: { start: Date; end: Date };
}

const categoryLabels: Record<ExpenseCategory, string> = {
  travel: 'Travel',
  meals: 'Meals',
  supplies: 'Supplies',
  equipment: 'Equipment',
  software: 'Software',
  services: 'Services',
  marketing: 'Marketing',
  training: 'Training',
  other: 'Other',
};

export const exportExpensesToExcel = (
  expenses: Expense[],
  options: ExportOptions = {}
): void => {
  const { title = 'Expenses Report' } = options;

  const data = expenses.map((expense) => ({
    Title: expense.title,
    Description: expense.description,
    Amount: expense.amount,
    Currency: expense.currency,
    Category: categoryLabels[expense.category],
    Status: expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
    'Submitted By': expense.submittedByName,
    'Submitted Date': format(expense.submittedAt.toDate(), 'yyyy-MM-dd'),
    'Approved By': expense.approvedByName || '',
    'Approved Date': expense.approvedAt
      ? format(expense.approvedAt.toDate(), 'yyyy-MM-dd')
      : '',
    'Rejection Reason': expense.rejectionReason || '',
    Sensitive: expense.isSensitive ? 'Yes' : 'No',
    Receipts: expense.receipts.length,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

  // Add summary sheet
  const summary = calculateSummary(expenses);
  const summaryData = [
    ['Summary Report'],
    [''],
    ['Total Expenses', summary.total],
    ['Total Amount', summary.totalAmount],
    [''],
    ['By Status'],
    ['Draft', summary.byStatus.draft],
    ['Pending', summary.byStatus.pending],
    ['Approved', summary.byStatus.approved],
    ['Rejected', summary.byStatus.rejected],
    ['Paid', summary.byStatus.paid],
    [''],
    ['By Category'],
    ...Object.entries(summary.byCategory).map(([cat, amount]) => [
      categoryLabels[cat as ExpenseCategory],
      amount,
    ]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const fileName = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportExpensesToPDF = (
  expenses: Expense[],
  options: ExportOptions = {}
): void => {
  const { title = 'Expenses Report' } = options;
  const doc = new jsPDF();
  const summary = calculateSummary(expenses);

  // Title
  doc.setFontSize(20);
  doc.text(title, 20, 20);

  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 30);

  // Summary section
  doc.setFontSize(14);
  doc.text('Summary', 20, 45);

  doc.setFontSize(11);
  let y = 55;

  doc.text(`Total Expenses: ${summary.total}`, 20, y);
  y += 8;
  doc.text(
    `Total Amount: ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(summary.totalAmount)}`,
    20,
    y
  );
  y += 15;

  // Status breakdown
  doc.setFontSize(12);
  doc.text('By Status:', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`  Draft: ${summary.byStatus.draft}`, 20, y);
  y += 6;
  doc.text(`  Pending: ${summary.byStatus.pending}`, 20, y);
  y += 6;
  doc.text(`  Approved: ${summary.byStatus.approved}`, 20, y);
  y += 6;
  doc.text(`  Rejected: ${summary.byStatus.rejected}`, 20, y);
  y += 6;
  doc.text(`  Paid: ${summary.byStatus.paid}`, 20, y);
  y += 15;

  // Category breakdown
  doc.setFontSize(12);
  doc.text('By Category:', 20, y);
  y += 8;
  doc.setFontSize(10);
  Object.entries(summary.byCategory).forEach(([cat, amount]) => {
    doc.text(
      `  ${categoryLabels[cat as ExpenseCategory]}: ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)}`,
      20,
      y
    );
    y += 6;
  });

  // Expense details table
  if (options.includeDetails && expenses.length > 0) {
    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.text('Expense Details', 20, y);
    y += 10;

    doc.setFontSize(8);
    const headers = ['Title', 'Amount', 'Category', 'Status', 'Submitted'];
    const colWidths = [60, 25, 30, 25, 30];
    let x = 20;

    // Header row
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 6;

    // Data rows
    expenses.slice(0, 30).forEach((expense) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      x = 20;
      doc.text(expense.title.substring(0, 25), x, y);
      x += colWidths[0];
      doc.text(
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: expense.currency,
          maximumFractionDigits: 0,
        }).format(expense.amount),
        x,
        y
      );
      x += colWidths[1];
      doc.text(categoryLabels[expense.category], x, y);
      x += colWidths[2];
      doc.text(expense.status, x, y);
      x += colWidths[3];
      doc.text(format(expense.submittedAt.toDate(), 'MMM d'), x, y);
      y += 5;
    });

    if (expenses.length > 30) {
      y += 5;
      doc.text(`... and ${expenses.length - 30} more expenses`, 20, y);
    }
  }

  const fileName = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

interface ExpenseSummary {
  total: number;
  totalAmount: number;
  byStatus: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  byCategory: Record<ExpenseCategory, number>;
}

const calculateSummary = (expenses: Expense[]): ExpenseSummary => {
  const byCategory: Record<ExpenseCategory, number> = {
    travel: 0,
    meals: 0,
    supplies: 0,
    equipment: 0,
    software: 0,
    services: 0,
    marketing: 0,
    training: 0,
    other: 0,
  };

  const byStatus = {
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
  };

  let totalAmount = 0;

  expenses.forEach((expense) => {
    totalAmount += expense.amount;
    byStatus[expense.status]++;
    byCategory[expense.category] += expense.amount;
  });

  return {
    total: expenses.length,
    totalAmount,
    byStatus,
    byCategory,
  };
};

export const exportBudgetReport = (
  budgetData: {
    name: string;
    allocated: number;
    spent: number;
    remaining: number;
  }[],
  options: ExportOptions = {}
): void => {
  const { title = 'Budget Report' } = options;

  const worksheet = XLSX.utils.json_to_sheet(budgetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');

  const fileName = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
