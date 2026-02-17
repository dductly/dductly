import React, { useState, useRef, useMemo } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  name,
  disabled,
  className,
  multiline = false,
  rows,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const lower = value.toLowerCase();
    return Array.from(
      new Set(
        suggestions.filter(
          (s) => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower
        )
      )
    ).slice(0, 8);
  }, [value, suggestions]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleFocus = () => {
    if (value.trim() && filtered.length > 0) {
      setIsOpen(true);
    }
  };

  const showDropdown = isOpen && filtered.length > 0;

  const inputProps = {
    value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onFocus: handleFocus,
    placeholder,
    name,
    disabled,
    className,
    autoComplete: "off" as const,
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      {multiline ? (
        <textarea {...inputProps} rows={rows} />
      ) : (
        <input type="text" {...inputProps} />
      )}
      {showDropdown && (
        <ul className="autocomplete-dropdown">
          {filtered.map((item, i) => (
            <li
              key={item}
              className={`autocomplete-item ${
                i === highlightedIndex ? "autocomplete-item-highlighted" : ""
              }`}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
