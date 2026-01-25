import { FC, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Expense, ExpenseCategory } from '@/types/expense';
import { Card } from '@/components/ui/Card';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface ExpenseChartProps {
  expenses: Expense[];
  type?: 'category' | 'status' | 'trend' | 'monthly';
  height?: number;
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

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  travel: '#3B82F6',
  meals: '#10B981',
  supplies: '#F59E0B',
  equipment: '#EF4444',
  software: '#8B5CF6',
  services: '#EC4899',
  marketing: '#06B6D4',
  training: '#84CC16',
  other: '#6B7280',
};

const STATUS_COLORS = {
  draft: '#9CA3AF',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  paid: '#3B82F6',
};

export const ExpenseChart: FC<ExpenseChartProps> = ({
  expenses,
  type = 'category',
  height = 300,
}) => {
  const categoryData = useMemo(() => {
    const data: Record<ExpenseCategory, number> = {
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

    expenses.forEach((expense) => {
      data[expense.category] += expense.amount;
    });

    return Object.entries(data)
      .filter(([_, value]) => value > 0)
      .map(([category, amount]) => ({
        name: categoryLabels[category as ExpenseCategory],
        value: amount,
        category: category as ExpenseCategory,
      }));
  }, [expenses]);

  const statusData = useMemo(() => {
    const data: Record<string, number> = {
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
    };

    expenses.forEach((expense) => {
      data[expense.status] += expense.amount;
    });

    return Object.entries(data)
      .filter(([_, value]) => value > 0)
      .map(([status, amount]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: amount,
        status,
      }));
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 5),
      end: endOfMonth(now),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = expense.createdAt.toDate();
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const approved = monthExpenses
        .filter((e) => e.status === 'approved' || e.status === 'paid')
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: format(month, 'MMM'),
        total,
        approved,
        count: monthExpenses.length,
      };
    });
  }, [expenses]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 11),
      end: endOfMonth(now),
    });

    let cumulative = 0;
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthTotal = expenses
        .filter((expense) => {
          const expenseDate = expense.createdAt.toDate();
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      cumulative += monthTotal;

      return {
        name: format(month, 'MMM yy'),
        amount: monthTotal,
        cumulative,
      };
    });
  }, [expenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (type === 'category') {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry) => (
                <Cell
                  key={`cell-${entry.category}`}
                  fill={CATEGORY_COLORS[entry.category]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  if (type === 'status') {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Expenses by Status</h3>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="value" name="Amount">
              {statusData.map((entry) => (
                <Cell
                  key={`cell-${entry.status}`}
                  fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  if (type === 'monthly') {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Monthly Expenses</h3>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="total" name="Total" fill="#3B82F6" />
            <Bar dataKey="approved" name="Approved" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  if (type === 'trend') {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Expense Trend</h3>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Area
              type="monotone"
              dataKey="amount"
              name="Monthly"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              name="Cumulative"
              stroke="#10B981"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  return null;
};
