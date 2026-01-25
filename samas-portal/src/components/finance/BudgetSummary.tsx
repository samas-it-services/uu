import { FC, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Budget, Expense, ExpenseCategory } from '@/types/expense';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface BudgetSummaryProps {
  budget?: Budget | null;
  expenses: Expense[];
  showCategories?: boolean;
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

interface CategorySummary {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export const BudgetSummary: FC<BudgetSummaryProps> = ({
  budget,
  expenses,
  showCategories = true,
}) => {
  const summary = useMemo(() => {
    // Calculate actual spending from expenses
    const actualSpending = expenses
      .filter((e) => e.status === 'approved' || e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingSpending = expenses
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalBudget = budget?.totalAmount || 0;
    const remaining = totalBudget - actualSpending;
    const percentUsed = totalBudget > 0 ? (actualSpending / totalBudget) * 100 : 0;

    // Calculate by category
    const categorySpending: Record<ExpenseCategory, number> = {
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

    expenses
      .filter((e) => e.status === 'approved' || e.status === 'paid')
      .forEach((expense) => {
        categorySpending[expense.category] += expense.amount;
      });

    const categorySummaries: CategorySummary[] = budget?.categories
      ? budget.categories.map((cat) => ({
          category: cat.category,
          allocated: cat.allocated,
          spent: categorySpending[cat.category],
          remaining: cat.allocated - categorySpending[cat.category],
          percentage: cat.allocated > 0
            ? (categorySpending[cat.category] / cat.allocated) * 100
            : 0,
        }))
      : Object.entries(categorySpending)
          .filter(([_, spent]) => spent > 0)
          .map(([category, spent]) => ({
            category: category as ExpenseCategory,
            allocated: 0,
            spent,
            remaining: -spent,
            percentage: 100,
          }));

    return {
      totalBudget,
      actualSpending,
      pendingSpending,
      remaining,
      percentUsed,
      categorySummaries,
    };
  }, [budget, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: budget?.currency || 'USD',
    }).format(amount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Budget
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(summary.totalBudget)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Spent (Approved)
              </div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(summary.actualSpending)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Pending
              </div>
              <div className="text-xl font-bold text-yellow-600">
                {formatCurrency(summary.pendingSpending)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                summary.remaining >= 0
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-red-100 dark:bg-red-900'
              )}
            >
              <TrendingDown
                className={cn(
                  'h-5 w-5',
                  summary.remaining >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Remaining
              </div>
              <div
                className={cn(
                  'text-xl font-bold',
                  summary.remaining >= 0 ? 'text-blue-600' : 'text-red-600'
                )}
              >
                {formatCurrency(summary.remaining)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Progress */}
      {summary.totalBudget > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Budget Usage
            </span>
            <span className="text-sm text-gray-500">
              {summary.percentUsed.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                getProgressColor(summary.percentUsed)
              )}
              style={{ width: `${Math.min(summary.percentUsed, 100)}%` }}
            />
          </div>
          {summary.percentUsed >= 80 && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {summary.percentUsed >= 100
                ? 'Budget exceeded!'
                : 'Approaching budget limit'}
            </p>
          )}
        </Card>
      )}

      {/* Category Breakdown */}
      {showCategories && summary.categorySummaries.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <div className="space-y-4">
            {summary.categorySummaries
              .sort((a, b) => b.spent - a.spent)
              .map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {categoryLabels[cat.category]}
                    </span>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(cat.spent)}
                      </span>
                      {cat.allocated > 0 && (
                        <>
                          <span className="mx-1">/</span>
                          <span>{formatCurrency(cat.allocated)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {cat.allocated > 0 && (
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          getProgressColor(cat.percentage)
                        )}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  )}
                  {cat.allocated === 0 && (
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
