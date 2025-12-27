
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT',
}

export type RecurrencePeriod = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type DateRangeOption = '7D' | '15D' | '30D' | '60D' | 'CUSTOM';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT',
  WALLET = 'WALLET',
}

export enum ProfileType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  COUPLE = 'COUPLE',
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  accountId: string;
  cardId?: string;
  recurrencePeriod?: RecurrencePeriod;
  recurrenceInterval?: number;
  recurrenceLimit?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface FinancialProfile {
    id: string;
    name: string;
    type: ProfileType;
    accounts: Account[];
    transactions: Transaction[];
    creditCards: CreditCard[];
    goals: Goal[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  activeProfileId: string;
  profiles: FinancialProfile[];
}