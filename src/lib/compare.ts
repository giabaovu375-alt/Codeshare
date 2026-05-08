const KEY = "codeshare:compare";

export const getCompareIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
};
export const setCompareIds = (ids: string[]) => {
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 3)));
  window.dispatchEvent(new CustomEvent("compare:change"));
};
export const toggleCompare = (id: string) => {
  const cur = getCompareIds();
  const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id].slice(0, 3);
  setCompareIds(next);
  return next;
};
