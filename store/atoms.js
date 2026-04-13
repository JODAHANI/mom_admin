import { atom } from 'jotai';

export const kioskModeAtom = atom(false);
export const notificationsAtom = atom([]);
export const sidebarActiveAtom = atom('products');
export const searchQueryAtom = atom('');
export const highlightOrderAtom = atom(null);
