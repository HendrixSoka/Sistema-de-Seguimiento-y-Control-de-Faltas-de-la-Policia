import { useState, useRef, useEffect } from "react";
import { Box, Textarea } from "@chakra-ui/react";

export default function ComboBoxAutoResize({ value, onChange, onInputChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(value || "");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef(null);

  useEffect(() => setFilter(value || ""), [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(filter.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : prev
        );
        break;

      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          const selected = filtered[highlightIndex];
          setFilter(selected.label);
          setOpen(false);
          setHighlightIndex(-1);
          onChange?.(selected.value);
        }
        break;

      case "Escape":
        setOpen(false);
        setHighlightIndex(-1);
        break;

      default:
        break;
    }
  };

  return (
    <Box position="relative" ref={ref}>
      <Textarea
        value={filter}
        onChange={(e) => {
          const texto = e.target.value;
          setFilter(texto);
          setOpen(true);
          setHighlightIndex(-1);

          // Llamada al onInputChange cuando el usuario escribe
          onInputChange?.(texto);

          // Llamada al onChange para reflejar el valor actual en el estado externo
          onChange?.(texto);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe para buscar..."
        resize="none"
      />

      {open && filtered.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          shadow="md"
          borderRadius="md"
          mt={1}
          zIndex={20}
          maxH="200px"
          overflowY="auto"
        >
          {filtered.map((opt, idx) => (
            <Box
              key={idx}
              p={2}
              cursor="pointer"
              bg={idx === highlightIndex ? "gray.100" : "white"}
              onMouseEnter={() => setHighlightIndex(idx)}
              onMouseDown={() => {
                // onMouseDown en vez de onClick para evitar que el blur cierre antes de seleccionar
                setFilter(opt.label);
                setOpen(false);
                setHighlightIndex(-1);
                onChange?.(opt.value);
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
