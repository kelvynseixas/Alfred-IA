
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT',
}

export type RecurrencePeriod = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type DateRangeOption = 'TODAY' | 'YESTERDAY' | '7D' | '15D' | '30D' | '60D' | '90D' | 'CUSTOM';

export interface Plan {
    id: number;
    name: string;
    price: string; // Vem como string do numeric do PG
    period: string;
    features: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  plan_status: string;
  plan_name?: string;
  plan_expires_at?: string;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  accountId: string;
  recurrencePeriod?: RecurrencePeriod;
  recurrenceInterval?: number;
  recurrenceLimit?: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color?: string;
}

export enum InvestmentType {
  CDB = 'CDB',
  TESOURO = 'TESOURO',
  ACOES = 'ACOES',
  FII = 'FII',
  CRYPTO = 'CRYPTO',
  POUPANCA = 'POUPANCA',
  OUTRO = 'OUTRO'
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  amount: number;
  yieldRate: number;
  redemptionTerms: string;
  startDate: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface GoalEntry {
  id: string;
  amount: number;
  date: string;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  recurrence: RecurrencePeriod;
  isCompleted: boolean;
}

export enum ListType {
    SUPPLIES = 'SUPPLIES',
    WISHES = 'WISHES'
}

export interface ListItem {
    id: string;
    listId: string;
    name: string;
    quantity: number;
    isCompleted: boolean;
}

export interface ShoppingList {
    id: string;
    name: string;
    type: ListType;
    items?: ListItem[];
}
