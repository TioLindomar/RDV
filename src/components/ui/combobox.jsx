import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export function Combobox({ value, onChange, placeholder, emptyMessage, disabled }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMedications = async (query) => {
    if (query.length < 3) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://bula.vercel.app/pesquisar?nome=${encodeURIComponent(query)}&pagina=1`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const fetchedOptions = data.content.map(med => ({
        value: med.nomeProduto.toLowerCase(),
        label: med.nomeProduto,
      }));
      setOptions(fetchedOptions);
    } catch (error) {
      console.error("Failed to fetch medications:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchMedications, 500), []);

  useEffect(() => {
    debouncedFetch(searchTerm);
  }, [searchTerm, debouncedFetch]);

  const handleSelect = (currentValue) => {
    const label = options.find((option) => option.value === currentValue)?.label || currentValue;
    onChange(label);
    setSearchTerm(label);
    setOpen(false);
  };

  const handleInputChange = (search) => {
    setSearchTerm(search);
    onChange(search);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Command className="bg-transparent">
            <CommandInput
              placeholder={placeholder}
              value={searchTerm}
              onValueChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              disabled={disabled}
            />
          </Command>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="absolute inset-y-0 right-0 px-2 text-foreground hover:bg-transparent"
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 text-foreground" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-effect border-border">
        <Command className="bg-card">
          <CommandList>
            {loading && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!loading && options.length === 0 && searchTerm.length > 2 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.label ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}