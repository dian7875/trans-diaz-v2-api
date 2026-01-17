import { Travel } from "generated/prisma/client";

export type TruckGroup = {
  travels: Travel[];
  totals: {
    totalNoIVAmount: number;
    totalWithIVAmount: number;
    totalIVAmount: number;
  };
  totalExpenses: number;
  remainingAmount: number;
};


export type ExpensesByTruck = {
  expenses: {
    date: Date;
    name: string;
    amount: number;
    travelCode?: string;
    destination?: string;
  }[];
  totalExpenses: number;
};
