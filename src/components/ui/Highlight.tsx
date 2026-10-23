interface HighlightProps {
  text: string;
  term?: string;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wraps matches of the search term in <mark>; React escapes the text, so no HTML injection is possible
export const Highlight = ({ text, term }: HighlightProps) => {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'));
  return parts.map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part));
};
