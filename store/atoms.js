import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const notificationsAtom = atom([]);
export const sidebarActiveAtom = atom('products');
export const searchQueryAtom = atom('');
export const highlightOrderAtom = atom(null);
export const sidebarOpenAtom = atom(false);

// 테이블 비우기 시 영수증 자동 출력 (브라우저별 저장)
export const autoPrintOnClearAtom = atomWithStorage('autoPrintOnClear', false);

// 주문내역 심플 뷰 — 통계/필터 숨기기 (브라우저별 저장)
export const simpleViewAtom = atomWithStorage('simpleView', false);
