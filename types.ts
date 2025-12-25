export enum ModuleType {
  FINANCE = 'FINANCE',
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

export interface Plan {
  id: string; // 'MONTHLY', 'SEMIANNUAL', 'ANNUAL'
  name: string;
  type: SubscriptionType;
  price: number;
  trialDays: number;
  active: boolean;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT'
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  recurrence?: 'NONE' | 'MONTHLY' | 'WEEKLY' | 'YEARLY';
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
  notified?: boolean;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
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
  method: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  status: 'PAID' | 'PENDING' | 'FAILED';
  invoiceUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  subscription?: SubscriptionType;
  planId?: string;
  trialEndsAt?: string;
  active: boolean;
  isTestUser?: boolean; // Novo campo
  modules: ModuleType[];
  since: string;
  aiUsageTokenCount?: number;
  avatarUrl?: string;
  paymentHistory?: PaymentHistory[];
  readAnnouncements?: string[]; 
  dismissedAnnouncements?: string[]; 
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'FINANCE' | 'TASK' | 'SYSTEM';
  read: boolean;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  isPopup: boolean;
  date: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string; 
}

export type DateRangeOption = '7D' | '15D' | '30D' | '60D' | 'CUSTOM';

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  appliesTo: SubscriptionType[]; // Array de strings
  active: boolean;
}

export interface SystemConfig {
  timezone: string; 
  aiProvider: 'GEMINI' | 'OPENAI' | 'ANTHROPIC';
  aiKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
  };
  webhookUrl: string;
  evolutionApi: {
    enabled: boolean;
    baseUrl: string;
    globalApiKey: string;
    instanceName: string;
    instanceToken?: string;
  };
  paymentGateway: {
    provider: 'PAGSEGURO';
    email: string;
    token: string;
    sandbox: boolean;
    rates: {
      creditCard: number; 
      creditCardInstallment: number; 
      pix: number; 
      boleto: number; 
    }
  };
  branding: {
    logoUrl?: string;
    chatAvatarUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

export type AIActionType = 
  | 'ADD_TRANSACTION' 
  | 'ADD_TASK' 
  | 'UPDATE_TASK' // Novo
  | 'ADD_LIST_ITEM' 
  | 'COMPLETE_LIST_ITEM'
  | 'NONE';

export interface AIResponse {
  reply: string;
  action?: {
    type: AIActionType;
    payload: any;
  };
}