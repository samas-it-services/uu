import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { ReceiptUpload } from './ReceiptUpload';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateExpense,
  useUpdateExpense,
  useUploadReceipt,
  useDeleteReceipt,
} from '@/hooks/useExpenses';

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  category: z.enum([
    'travel',
    'meals',
    'supplies',
    'equipment',
    'software',
    'services',
    'marketing',
    'training',
    'other',
  ]),
  projectId: z.string().nullable(),
  isSensitive: z.boolean(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  projectId?: string | null;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'services', label: 'Services' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

export const ExpenseModal: FC<ExpenseModalProps> = ({
  open,
  onOpenChange,
  expense,
  projectId,
}) => {
  const { user } = useAuth();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const uploadReceipt = useUploadReceipt();
  const deleteReceipt = useDeleteReceipt();
  const [expenseId, setExpenseId] = useState<string | null>(expense?.id || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: expense?.title || '',
      description: expense?.description || '',
      amount: expense?.amount || 0,
      currency: expense?.currency || 'USD',
      category: expense?.category || 'other',
      projectId: expense?.projectId || projectId || null,
      isSensitive: expense?.isSensitive || false,
    },
  });

  const category = watch('category');
  const currency = watch('currency');
  const isSensitive = watch('isSensitive');

  useEffect(() => {
    if (expense) {
      reset({
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        projectId: expense.projectId,
        isSensitive: expense.isSensitive,
      });
      setExpenseId(expense.id);
    } else {
      reset({
        title: '',
        description: '',
        amount: 0,
        currency: 'USD',
        category: 'other',
        projectId: projectId || null,
        isSensitive: false,
      });
      setExpenseId(null);
    }
  }, [expense, projectId, reset, open]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return;

    try {
      if (expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          data: {
            title: data.title,
            description: data.description || '',
            amount: data.amount,
            currency: data.currency,
            category: data.category,
            projectId: data.projectId,
            isSensitive: data.isSensitive,
          },
        });
      } else {
        const id = await createExpense.mutateAsync({
          title: data.title,
          description: data.description || '',
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          projectId: data.projectId,
          submittedBy: user.id,
          submittedByName: user.displayName,
          isSensitive: data.isSensitive,
        });
        setExpenseId(id);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleUploadReceipt = async (file: File) => {
    if (!expenseId) {
      // Create expense first if it doesn't exist
      if (!user) return;
      const formData = watch();
      const id = await createExpense.mutateAsync({
        title: formData.title || 'New Expense',
        description: formData.description || '',
        amount: formData.amount || 0,
        currency: formData.currency || 'USD',
        category: formData.category || 'other',
        projectId: formData.projectId,
        submittedBy: user.id,
        submittedByName: user.displayName,
        isSensitive: formData.isSensitive || false,
      });
      setExpenseId(id);
      await uploadReceipt.mutateAsync({ expenseId: id, file });
    } else {
      await uploadReceipt.mutateAsync({ expenseId, file });
    }
  };

  const handleDeleteReceipt = (receiptId: string) => {
    if (expenseId) {
      deleteReceipt.mutate({ expenseId, receiptId });
    }
  };

  const isLoading = createExpense.isPending || updateExpense.isPending;
  const receipts = expense?.receipts || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Edit Expense' : 'New Expense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Title *
              </label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter expense title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Enter expense description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Amount *
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Currency *
                </label>
                <Select
                  value={currency}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category *
              </label>
              <Select
                value={category}
                onValueChange={(value) => setValue('category', value as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Sensitive expense toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSensitive"
                checked={isSensitive}
                onCheckedChange={(checked) => setValue('isSensitive', checked as boolean)}
              />
              <label
                htmlFor="isSensitive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mark as sensitive (only visible to finance team)
              </label>
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipts
              </label>
              <ReceiptUpload
                receipts={receipts}
                onUpload={handleUploadReceipt}
                onDelete={handleDeleteReceipt}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : expense ? (
                'Update Expense'
              ) : (
                'Create Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
