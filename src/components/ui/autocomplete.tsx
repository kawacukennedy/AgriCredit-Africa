import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"
import { Check, ChevronDown } from "lucide-react"

export interface AutocompleteOption {
  value: string
  label: string
  disabled?: boolean
}

export interface AutocompleteProps {
  options: AutocompleteOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
  debounceMs?: number
  maxSuggestions?: number
  className?: string
}

const Autocomplete = React.forwardRef<HTMLDivElement, AutocompleteProps>(
  ({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    error = false,
    helperText,
    debounceMs = 300,
    maxSuggestions = 10,
    className,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')
    const [filteredOptions, setFilteredOptions] = React.useState<AutocompleteOption[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLUListElement>(null)

    React.useEffect(() => {
      if (value) {
        const option = options.find(opt => opt.value === value)
        setInputValue(option?.label || '')
      }
    }, [value, options])

    const filterOptions = React.useCallback(
      (query: string) => {
        if (!query) {
          setFilteredOptions(options.slice(0, maxSuggestions))
          return
        }

        const filtered = options
          .filter(option =>
            option.label.toLowerCase().includes(query.toLowerCase()) &&
            !option.disabled
          )
          .slice(0, maxSuggestions)

        setFilteredOptions(filtered)
      },
      [options, maxSuggestions]
    )

    const debouncedFilter = React.useMemo(
      () => {
        let timeoutId: NodeJS.Timeout
        return (query: string) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => filterOptions(query), debounceMs)
        }
      },
      [filterOptions, debounceMs]
    )

    React.useEffect(() => {
      debouncedFilter(inputValue)
    }, [inputValue, debouncedFilter])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      setSelectedIndex(-1)
      setIsOpen(true)
    }

    const handleOptionSelect = (option: AutocompleteOption) => {
      setInputValue(option.label)
      setIsOpen(false)
      setSelectedIndex(-1)
      onChange?.(option.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown') {
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
            handleOptionSelect(filteredOptions[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    }

    React.useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
        const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
        selectedElement?.scrollIntoView({ block: 'nearest' })
      }
    }, [selectedIndex])

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            endAdornment={
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )} />
              </Button>
            }
          />
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-dropdown top-full mt-1 w-full max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white shadow-level-3"
          >
            {filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50",
                  selectedIndex === index && "bg-neutral-100",
                  option.disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !option.disabled && handleOptionSelect(option)}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="h-4 w-4 text-primary-500" />
                )}
              </li>
            ))}
          </ul>
        )}

        {helperText && (
          <p className={cn(
            "mt-1 text-xs",
            error ? "text-error" : "text-neutral-500"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Autocomplete.displayName = "Autocomplete"

export { Autocomplete }