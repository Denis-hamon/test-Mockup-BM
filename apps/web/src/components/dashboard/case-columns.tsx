"use client";

export type CaseRow = {
  id: string;
  clientName: string;
  problemType: string;
  overallScore: number | null;
  status: string;
  createdAt: Date;
  legalDomain: string | null;
};

export const CASE_COLUMNS = [
  { key: "clientName", label: "Client", sortable: true, className: "w-[30%]" },
  { key: "problemType", label: "Type", sortable: false, className: "w-[20%] hidden lg:table-cell" },
  { key: "overallScore", label: "Score", sortable: true, className: "w-[12%]" },
  { key: "status", label: "Statut", sortable: true, className: "w-[12%]" },
  { key: "createdAt", label: "Date", sortable: true, className: "w-[14%] hidden lg:table-cell" },
  { key: "actions", label: "", sortable: false, className: "w-[12%]" },
] as const;
