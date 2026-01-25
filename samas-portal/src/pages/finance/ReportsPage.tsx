import { FC, useState, useMemo } from 'react';
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ExpenseChart } from '@/components/finance/ExpenseChart';
import { BudgetSummary } from '@/components/finance/BudgetSummary';
import { useExpenses } from '@/hooks/useExpenses';
import { usePermissions } from '@/hooks/usePermissions';
import { exportExpensesToExcel, exportExpensesToPDF } from '@/utils/exportFinance';

type DateRange = '1m' | '3m' | '6m' | '1y' | 'all';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '1m', label: 'Last Month' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

export const ReportsPage: FC = () => {
  const { canAccessSensitiveData } = usePermissions();
  const [dateRange, setDateRange] = useState<DateRange>('3m');
  const { data, isLoading } = useExpenses();

  const canSeeSensitive = canAccessSensitiveData;

  const allExpenses = useMemo(() => {
    const expenses = data?.pages.flatMap((page) => page.expenses) || [];
    // Filter sensitive data if user doesn't have access
    if (!canSeeSensitive) {
      return expenses.filter((e) => !e.isSensitive);
    }
    return expenses;
  }, [data, canSeeSensitive]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateRange) {
      case '1m':
        startDate = startOfMonth(subMonths(now, 1));
        break;
      case '3m':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case '6m':
        startDate = startOfMonth(subMonths(now, 6));
        break;
      case '1y':
        startDate = startOfMonth(subMonths(now, 12));
        break;
      default:
        startDate = null;
    }

    if (!startDate) return allExpenses;

    return allExpenses.filter((expense) => {
      const expenseDate = expense.createdAt.toDate();
      return expenseDate >= startDate;
    });
  }, [allExpenses, dateRange]);

  const stats = useMemo(() => {
    const total = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const approved = filteredExpenses.filter(
      (e) => e.status === 'approved' || e.status === 'paid'
    );
    const approvedAmount = approved.reduce((sum, e) => sum + e.amount, 0);
    const pending = filteredExpenses.filter((e) => e.status === 'pending');
    const pendingAmount = pending.reduce((sum, e) => sum + e.amount, 0);
    const rejected = filteredExpenses.filter((e) => e.status === 'rejected');

    return {
      total,
      totalAmount,
      approved: approved.length,
      approvedAmount,
      pending: pending.length,
      pendingAmount,
      rejected: rejected.length,
      avgExpense: total > 0 ? totalAmount / total : 0,
    };
  }, [filteredExpenses]);

  const handleExportExcel = () => {
    const title = `Expenses_Report_${dateRangeOptions.find((d) => d.value === dateRange)?.label.replace(/\s+/g, '_')}`;
    exportExpensesToExcel(filteredExpenses, { title, includeDetails: true });
  };

  const handleExportPDF = () => {
    const title = `Expenses Report - ${dateRangeOptions.find((d) => d.value === dateRange)?.label}`;
    exportExpensesToPDF(filteredExpenses, { title, includeDetails: true });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Financial Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Analyze expense data and generate reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as DateRange)}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Expenses
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">
            {formatCurrency(stats.totalAmount)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-green-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.approved}
          </div>
          <div className="text-sm text-green-600">
            {formatCurrency(stats.approvedAmount)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="text-sm text-yellow-600">
            {formatCurrency(stats.pendingAmount)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Average Expense
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.avgExpense)}
          </div>
        </Card>
      </div>

      {/* Budget Summary */}
      <BudgetSummary expenses={filteredExpenses} showCategories />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart expenses={filteredExpenses} type="category" />
        <ExpenseChart expenses={filteredExpenses} type="status" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart expenses={filteredExpenses} type="monthly" />
        <ExpenseChart expenses={allExpenses} type="trend" />
      </div>

      {/* Top Expenses Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Top Expenses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-500">
                  Title
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">
                  Category
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">
                  Submitted By
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">
                  Date
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">
                  Amount
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 10)
                .map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-2 px-3 font-medium">{expense.title}</td>
                    <td className="py-2 px-3 capitalize">{expense.category}</td>
                    <td className="py-2 px-3">{expense.submittedByName}</td>
                    <td className="py-2 px-3">
                      {format(expense.createdAt.toDate(), 'MMM d, yyyy')}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          expense.status === 'approved' || expense.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : expense.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : expense.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
