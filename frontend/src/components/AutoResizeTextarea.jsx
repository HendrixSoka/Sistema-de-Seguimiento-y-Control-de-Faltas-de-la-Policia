import { Textarea } from "@chakra-ui/react";
import { useRef, useEffect } from "react";

function AutoResizeTextarea({ value, onChange, ...props }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reinicia la altura
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // ajusta según contenido
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      resize="none"
      overflow="hidden"
      variant="unstyled"
      size="sm"
      textAlign="center"
      p={1}
      lineHeight="short"
      {...props}
    />
  );
}

export default AutoResizeTextarea;
