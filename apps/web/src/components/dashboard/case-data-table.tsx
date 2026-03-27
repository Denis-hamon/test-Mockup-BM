"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CASE_COLUMNS, type CaseRow } from "@/components/dashboard/case-columns";
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon } from "lucide-react";

interface CaseDataTableProps {
  data: CaseRow[];
  total: number;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function SortIcon({ columnKey, currentSort, currentOrder }: {
  columnKey: string;
  currentSort?: string;
  currentOrder?: "asc" | "desc";
}) {
  if (currentSort !== columnKey) {
    return <ChevronsUpDownIcon className="ml-1 inline size-3 text-muted-foreground" />;
  }
  return currentOrder === "asc" ? (
    <ChevronUpIcon className="ml-1 inline size-3" />
  ) : (
    <ChevronDownIcon className="ml-1 inline size-3" />
  );
}

function getPaginationPages(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) pages.push("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push("ellipsis");

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

// Mobile card view for a single case row
function CaseCard({ row }: { row: CaseRow }) {
  return (
    <Link
      href={`/dossiers/${row.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold">{row.clientName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.problemType}</p>
        </div>
        <ScoreBadge score={row.overallScore} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={row.status} />
        <time className="text-xs text-muted-foreground">
          {dateFormatter.format(new Date(row.createdAt))}
        </time>
      </div>
    </Link>
  );
}

export function CaseDataTable({
  data,
  total,
  page,
  pageSize,
  sortBy,
  sortOrder,
}: CaseDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  const hasFilters = !!(
    searchParams.get("status") ||
    searchParams.get("specialty") ||
    searchParams.get("score") ||
    searchParams.get("search") ||
    searchParams.get("dateFrom") ||
    searchParams.get("dateTo")
  );

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === key) {
      params.set("order", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", key);
      params.set("order", "desc");
    }
    params.delete("page");
    router.push(`/dossiers?${params.toString()}`);
  }

  function buildPageUrl(pageNum: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNum <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(pageNum));
    }
    return `/dossiers?${params.toString()}`;
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-medium">
          {hasFilters
            ? "Aucun dossier ne correspond a vos filtres."
            : "Aucun dossier pour le moment"}
        </p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {hasFilters
            ? "Essayez d'elargir vos criteres de recherche."
            : "Les dossiers apparaitront ici des qu'un client soumettra une demande via votre formulaire d'intake."}
        </p>
      </div>
    );
  }

  const paginationPages = getPaginationPages(page, totalPages);

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: Card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((row) => (
          <CaseCard key={row.id} row={row} />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {CASE_COLUMNS.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center text-sm font-semibold hover:text-foreground"
                    >
                      {col.label}
                      <SortIcon
                        columnKey={col.key}
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                      />
                    </button>
                  ) : (
                    <span className="text-sm font-semibold">{col.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                className="h-12 cursor-pointer"
                onClick={() => router.push(`/dossiers/${row.id}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/dossiers/${row.id}`);
                }}
              >
                <TableCell className="font-semibold">{row.clientName}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {row.problemType}
                </TableCell>
                <TableCell>
                  <ScoreBadge score={row.overallScore} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {dateFormatter.format(new Date(row.createdAt))}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link
                        href={`/dossiers/${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                  >
                    Ouvrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 1 ? buildPageUrl(page - 1) : undefined}
                text="Precedent"
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {paginationPages.map((p, i) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={buildPageUrl(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={page < totalPages ? buildPageUrl(page + 1) : undefined}
                text="Suivant"
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
