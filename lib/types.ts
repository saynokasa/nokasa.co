import { Entity, Vendor, Agent, Transaction, Order, User, Application, WasteType, VendorPricing, Notification, Address } from '@prisma/client';

export type OrderInclude = {
  user: boolean;
  vendor: boolean;
  agent: boolean;
  application: boolean;
  wasteType: boolean;
  transactions: boolean;
};

export type VendorInclude = {
  entity: boolean;
  agents: {
    include: {
      entity: boolean;
    };
  };
  vendorPricings: boolean;
  orders: {
    include: OrderInclude;
  };
};

export type AgentInclude = {
  entity: boolean;
  vendor: boolean;
  orders: {
    include: OrderInclude;
  };
};