import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MultiSelect({ options, selected, onChange, placeholder = 'Select…', disabled, className }: Props) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };

  const label = selected.length === 0 ? placeholder : selected.join(', ');

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex h-7 w-full items-center justify-between rounded-md border border-input bg-background px-2 text-xs',
            'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-left',
            className
          )}
          disabled={disabled}
        >
          <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>{label}</span>
          <ChevronDown className="w-3 h-3 ml-1 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1" align="start">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">No options</p>
        ) : (
          <div className="max-h-[200px] overflow-y-auto">
            {options.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded cursor-pointer text-xs"
              >
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                />
                <span className="font-mono">{opt}</span>
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
