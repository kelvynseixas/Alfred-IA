
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT',
}

export type RecurrencePeriod = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type DateRangeOption = 'TODAY' | 'YESTERDAY' | '7D' | '15D' | '30D' | '60D' | '90D' | 'CUSTOM';

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
  // Campos de Recorrência
  recurrencePeriod?: RecurrencePeriod;
  recurrenceInterval?: number;
  recurrenceLimit?: number;
}

// Novos Tipos para Investimentos
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
  yieldRate: number; // Porcentagem anual
  redemptionTerms: string; // Ex: D+1, No Vencimento
  startDate: string;
}

// Novos Tipos para Metas
export interface GoalEntry {
  id: string;
  amount: number; // Pode ser positivo ou negativo
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  entries?: GoalEntry[]; // Histórico opcional ao carregar lista
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
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
