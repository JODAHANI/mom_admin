export function stripPhone(s) {
  return (s || '').replace(/\D/g, '');
}

export function formatPhone(s) {
  const d = stripPhone(s).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
