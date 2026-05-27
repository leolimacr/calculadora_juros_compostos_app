import React from 'react';
import Dashboard from './Dashboard';
import { Transaction, Category, UserMeta } from '../../../types';

interface ControlaPageProps {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  onDeleteTransaction: (id: string) => void;
  onNavigate: (tool: string) => void;
  onOpenForm: (initialData?: Partial<Transaction>) => void;
  onSaveCategory: (category: any) => void;
  onDeleteCategory: (id: string, usageCount: number) => Promise<void>;
  userMeta: UserMeta | null | undefined;
  usagePercentage: number;
  isPremium: boolean;
  isLimitReached: boolean;
  onShowPaywall: () => void;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onEditTransaction: (t: Transaction) => void;
}

export const ControlaPage: React.FC<ControlaPageProps> = (props) => {
  return (
    <Dashboard
      transactions={props.transactions}
      isLoading={props.isLoading}
      categories={props.categories}
      onDeleteTransaction={props.onDeleteTransaction}
      onNavigate={props.onNavigate}
      onOpenForm={props.onOpenForm}
      onSaveCategory={props.onSaveCategory}
      onDeleteCategory={props.onDeleteCategory}
      userMeta={props.userMeta}
      usagePercentage={props.usagePercentage}
      isPremium={props.isPremium}
      isLimitReached={props.isLimitReached}
      onShowPaywall={props.onShowPaywall}
      isPrivacyMode={props.isPrivacyMode}
      onTogglePrivacy={props.onTogglePrivacy}
      onEditTransaction={props.onEditTransaction}
    />
  );
};
