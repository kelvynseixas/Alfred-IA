export enum ModuleType {
  FINANCE = 'FINANCE',
  TASKS = 'TASKS',
  LISTS = 'LISTS',
  ADMIN = 'ADMIN',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  DEPENDENT = 'DEPENDENT'
}

export enum SubscriptionType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY', // Trimestral
  SEMIANNUAL = 'SEMIANNUAL', // Semestral
  ANNUAL = 'ANNUAL'
}

export interface Plan {
  id: string;
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
  id: string; // UUID in Postgres
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO Timestamp
}

export enum TaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  DEFERRED = 'DEFERRED',
  CANCELLED = 'CANCELLED'
}

export interface Task {
  id: string; // UUID in Postgres
  title: string;
  date: string; // ISO date string
  time?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
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
  id: string; // UUID in Postgres
  name: string;
  items: ListItem[];
}

export interface Dependent {
  id: string;
  name: string;
  relation: string;
  email: string;
  phone: string;
  password?: string;
  avatarUrl?: string;
}

export interface User {
  id: string; // UUID in Postgres
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  subscription?: SubscriptionType;
  planId?: string; // Relation to Plan table
  trialEndsAt?: string;
  active: boolean;
  modules: ModuleType[];
  since: string;
  dependents: Dependent[];
  aiUsageTokenCount?: number;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'FINANCE' | 'TASK' | 'SYSTEM';
  read: boolean;
  date: string;
}

export type DateRangeOption = '7D' | '15D' | '30D' | '60D' | 'CUSTOM';

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  appliesTo: SubscriptionType[];
  active: boolean;
}

export interface SystemConfig {
  aiProvider: 'GEMINI' | 'OPENAI' | 'ANTHROPIC';
  aiKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
  };
  
  // Automation & Messaging
  webhookUrl: string; // N8N, Backend Custom
  evolutionApi: {
    enabled: boolean;
    baseUrl: string;
    globalApiKey: string;
    instanceName: string;
    instanceToken?: string;
  };

  paymentGateway: 'ASAAS' | 'STRIPE' | 'MERCADOPAGO';
  paymentApiKey: string;
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
  | 'UPDATE_TASK'
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