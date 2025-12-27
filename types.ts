

export enum ModuleType {
  FINANCE = 'FINANCE',
  PROJECTS = 'PROJECTS',
  INVESTMENTS = 'INVESTMENTS',
  TASKS = 'TASKS',
  LISTS = 'LISTS',
  ADMIN = 'ADMIN',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  TUTORIALS = 'TUTORIALS'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum SubscriptionType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL'
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  RESERVE = 'RESERVE' 
}

export type RecurrencePeriod = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'WALLET';
  balance: number;
  color?: string;
}

export interface Transaction {
  id: string;
  accountId?: string;
  projectId?: string; 
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  recurrencePeriod: RecurrencePeriod;
  recurrenceInterval?: number;
  recurrenceCount?: number;
}

export interface Investment {
  id: string;
  name: string;
  type: 'CDB' | 'TESOURO' | 'LCI_LCA' | 'ACOES' | 'FII' | 'CRYPTO';
  institution: string;
  initialAmount: number;
  currentAmount: number;
  interestRate: string; 
  startDate: string;
  dueDate?: string;
  liquidity: 'DAILY' | 'AT_MATURITY' | 'LOCKED';
  notes?: string;
}

export interface FinancialProject {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: 'RESERVE' | 'GOAL' | 'ASSET';
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export enum TaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  DEFERRED = 'DEFERRED',
  CANCELLED = 'CANCELLED'
}

export interface Task {
  id: string;
  title: string;
  date: string;
  time?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  recurrencePeriod: RecurrencePeriod;
  recurrenceInterval?: number;
  recurrenceCount?: number;
}

export enum ItemStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export interface ListItem {
  id: string;
  name: string;
  category: string;
  status: ItemStatus;
}

export interface ListGroup {
  id: string;
  name: string;
  items: ListItem[];
}

export interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  subscription?: SubscriptionType;
  planId?: string;
  active: boolean;
  isTestUser?: boolean;
  trialEndsAt?: string;
  paymentHistory?: PaymentHistory[];
  modules: ModuleType[];
}

export interface Plan {
  id: string;
  name: string;
  type: SubscriptionType;
  price: number;
  trialDays: number;
  active: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
}

export interface SystemConfig {
  timezone: string;
  aiProvider: string;
  aiKeys: { gemini: string };
  webhookUrl: string;
  evolutionApi: any;
  paymentGateway: any;
  branding: any;
}

export interface Coupon {
  id: string;
  code: string;
  value: number;
  type: 'PERCENTAGE' | 'FIXED';
  appliesTo: SubscriptionType[];
}

export interface AIResponse {
  reply: string;
  action?: {
    type: string;
    payload: any;
  };
}