"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { CalendarIcon, FilterIcon, XIcon } from "lucide-react";

interface CaseFiltersProps {
  currentFilters: {
    status?: string;
    specialty?: string;
    scoreRange?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

function FilterControls({
  currentFilters,
  onFilterChange,
}: {
  currentFilters: CaseFiltersProps["currentFilters"];
  onFilterChange: (key: string, value: string | undefined) => void;
}) {
  const [dateFromOpen, setDateFromOpen] = React.useState(false);
  const [dateToOpen, setDateToOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Status filter */}
      <Select
        value={currentFilters.status ?? ""}
        onValueChange={(val) => onFilterChange("status", val || undefined)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous</SelectItem>
          <SelectItem value="submitted">Nouveau</SelectItem>
          <SelectItem value="en_cours">En cours</SelectItem>
          <SelectItem value="termine">Termine</SelectItem>
          <SelectItem value="archive">Archive</SelectItem>
        </SelectContent>
      </Select>

      {/* Score range filter */}
      <Select
        value={currentFilters.scoreRange ?? ""}
        onValueChange={(val) => onFilterChange("score", val || undefined)}
      >
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue placeholder="Score" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous</SelectItem>
          <SelectItem value="faible">Faible</SelectItem>
          <SelectItem value="moyen">Moyen</SelectItem>
          <SelectItem value="eleve">Eleve</SelectItem>
        </SelectContent>
      </Select>

      {/* Date from picker */}
      <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-full justify-start text-left font-normal sm:w-[160px]" />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {currentFilters.dateFrom
            ? formatDateDisplay(currentFilters.dateFrom)
            : "Du"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined}
            onSelect={(date) => {
              onFilterChange(
                "dateFrom",
                date ? date.toISOString().split("T")[0] : undefined
              );
              setDateFromOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Date to picker */}
      <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-full justify-start text-left font-normal sm:w-[160px]" />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {currentFilters.dateTo
            ? formatDateDisplay(currentFilters.dateTo)
            : "Au"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined}
            onSelect={(date) => {
              onFilterChange(
                "dateTo",
                date ? date.toISOString().split("T")[0] : undefined
              );
              setDateToOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CaseFilters({ currentFilters }: CaseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [searchValue, setSearchValue] = React.useState(currentFilters.search ?? "");
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  React.useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      updateFilters("search", value || undefined);
    }, 300);
  }

  function updateFilters(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 on filter change
    params.delete("page");
    startTransition(() => {
      router.push(`/dossiers?${params.toString()}`);
    });
  }

  function clearFilters() {
    setSearchValue("");
    startTransition(() => {
      router.push("/dossiers");
    });
  }

  const hasActiveFilters = !!(
    currentFilters.status ||
    currentFilters.specialty ||
    currentFilters.scoreRange ||
    currentFilters.search ||
    currentFilters.dateFrom ||
    currentFilters.dateTo
  );

  const activeFilterCount = [
    currentFilters.status,
    currentFilters.specialty,
    currentFilters.scoreRange,
    currentFilters.search,
    currentFilters.dateFrom || currentFilters.dateTo ? "date" : undefined,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Input
            placeholder="Rechercher un client..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={isPending ? "opacity-70" : ""}
          />
        </div>

        {/* Mobile: Sheet trigger */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" className="gap-2" />
              }
            >
              <FilterIcon className="size-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span
                  className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground"
                  aria-label={`${activeFilterCount} filtres actifs`}
                >
                  {activeFilterCount}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
                <SheetDescription>Affinez la liste de vos dossiers</SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <FilterControls
                  currentFilters={currentFilters}
                  onFilterChange={updateFilters}
                />
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-4 gap-1"
                  >
                    <XIcon className="size-3" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="hidden gap-1 sm:inline-flex"
          >
            <XIcon className="size-3" />
            Effacer
          </Button>
        )}
      </div>

      {/* Desktop: Inline filters */}
      <div className="hidden sm:block">
        <FilterControls
          currentFilters={currentFilters}
          onFilterChange={updateFilters}
        />
      </div>
    </div>
  );
}
