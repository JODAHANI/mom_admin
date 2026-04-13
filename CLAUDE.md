# Admin (table-home-admin)

관리자용 대시보드. 태블릿에서 상품/주문/테이블/카테고리/공지를 관리한다.

## 실행

```bash
npm run dev    # localhost:3002
npm run build
npm start      # 프로덕션 3002
```

## 기술 스택

- Next.js 16 (Pages Router) / React 19 / JavaScript (TS 없음)
- styled-components (CSS-in-JS, next.config.js 컴파일러 활성화)
- @tanstack/react-query (서버 상태 - staleTime 10초, retry 1회)
- jotai (클라이언트 상태)
- axios (HTTP 클라이언트 + auth 인터셉터)
- WebSocket (ws) - 실시간 주문/직원호출 알림

## 환경변수

```
NEXT_PUBLIC_API_PORT=5001    # 백엔드 API 포트
NEXT_PUBLIC_WS_PORT=5001     # WebSocket 포트
```

## 디렉토리 구조

```
admin/
├── pages/
│   ├── _app.js              # QueryClient, GlobalStyle, ToastProvider, WS 연결
│   ├── _document.js         # SSR styled-components, lang="ko"
│   ├── index.js             # 토큰 확인 → /products 또는 /login 리다이렉트
│   ├── login.js             # 이메일/비밀번호 로그인 (이메일 기억 기능)
│   ├── products.js          # 상품 목록 (검색, 카테고리 필터, 순서변경)
│   ├── products/new.js      # 상품 등록
│   ├── products/[id].js     # 상품 수정/삭제
│   ├── orders.js            # 실시간 주문 관리 (상태별 탭, WS)
│   ├── order-history.js     # 주문 내역 + 통계 (날짜/상태/테이블 필터)
│   ├── tables.js            # 테이블 현황 (층별, 상태, 주문내역 모달)
│   ├── categories.js        # 카테고리 CRUD + 순서 변경
│   └── notices.js           # 공지사항 CRUD
├── components/
│   ├── Sidebar.js           # 고정 좌측 네비 (240px, #1b1d1f)
│   ├── Header.js            # 상단 바 (키오스크 토글, 알림 벨+드롭다운)
│   ├── ProductCard.js       # 상품 카드 (이미지, 뱃지, 품절/채널 토글)
│   ├── ProductForm.js       # 상품 폼 (등록/수정 공용, 이미지 드래그앤드롭)
│   ├── OrderCard.js         # 주문 카드 (상태 진행, 취소, 하이라이트)
│   ├── CategoryList.js      # 카테고리 리스트 (인라인 편집, 순서 변경)
│   ├── Toast.js             # 토스트 알림 Context (success, error, staffCall, order)
│   └── Toggle.js            # 토글 스위치 (sm/md 사이즈)
├── hooks/
│   ├── useAuth.js           # login/logout, 토큰 localStorage, 인증 리다이렉트
│   ├── useProducts.js       # CRUD + reorder + soldOut + toggleChannel
│   ├── useCategories.js     # CRUD + reorder
│   ├── useOrders.js         # 목록 + 상태변경 + WebSocket (NEW_ORDER, STAFF_CALL)
│   ├── useOrderHistory.js   # 주문내역 조회 + 통계 계산
│   ├── useTables.js         # CRUD + status (30초 자동 갱신)
│   └── useNotices.js        # CRUD
├── lib/
│   ├── api.js               # axios 인스턴스 (Bearer 토큰 인터셉터, 401 리다이렉트)
│   └── websocket.js         # WebSocketManager (자동 재연결 3초)
├── store/
│   └── atoms.js             # Jotai atoms (kioskMode, notifications, sidebar, search, highlightOrder)
└── public/images/           # 정적 이미지
```

## 페이지별 기능

### /login
- 이메일/비밀번호 로그인, JWT를 localStorage에 저장
- "이메일 기억" 체크박스

### /products
- 상품 그리드 뷰 + 카테고리 탭 필터 + 이름 검색
- 품절 토글, 키오스크/테이블 노출 토글
- 상품 순서 변경 (화살표)

### /products/new, /products/[id]
- ProductForm 공용 (등록/수정)
- 이미지 드래그앤드롭 업로드 → S3
- 카테고리 다중 선택, 뱃지 선택

### /orders
- 실시간 주문 카드 (WebSocket NEW_ORDER)
- 상태 탭: 미완료, 대기중, 준비중, 준비완료, 서빙완료
- 상태 진행: pending → preparing → ready → served
- 주문 취소, 새 주문 하이라이트 애니메이션

### /order-history
- 날짜 범위 필터 (오늘/이번주/이번달)
- 상태, 테이블, 메뉴 검색 필터
- 통계 카드: 총 주문, 총 매출, 취소 건수, 평균 주문금액
- 페이지네이션 (20건 단위)

### /tables
- 층별 필터 (전체, 1층, 2층, 야외)
- 테이블 카드: 상태(빈/주문중), 경과시간, 미완료 주문 뱃지
- 클릭 → 모달 (주문 목록, 테이블 비우기, 삭제)
- 30초 자동 갱신, 서빙대기 펄스 애니메이션

### /categories
- 카테고리 추가/인라인 수정/삭제/순서 변경

### /notices
- 공지사항 추가/인라인 수정/삭제

## 주요 패턴

### 인증
- `useAuth({ redirectIfUnauthenticated: true })` 각 페이지에서 호출
- `lib/api.js` 요청 인터셉터: localStorage 토큰 → Bearer 헤더
- 응답 인터셉터: 401 시 토큰 삭제 + /login 리다이렉트

### 레이아웃
- 모든 관리 페이지: 고정 Sidebar(좌) + Header(상) + Content(메인)
- Sidebar 240px, Header 60px

### 실시간 알림
- _app.js에서 WebSocket 연결
- useOrders 훅에서 NEW_ORDER/ORDER_STATUS/STAFF_CALL 수신
- Header 벨 아이콘 뱃지 + 드롭다운
- Toast 알림 (파랑: 주문, 주황: 직원호출)
- highlightOrderAtom으로 주문 카드 하이라이트

### 상태 관리
- 서버 상태: React Query (모든 API 데이터)
- 글로벌 UI: Jotai atoms (kioskMode, notifications, search, sidebar, highlight)
- 로컬 UI: useState (모달, 폼 입력 등)

### 스타일링
- styled-components 전용 (CSS 파일 없음)
- 주요 색상: #3182F6(파랑), #1B1D1F(텍스트), #8B95A1(회색), #F5F6F8(배경)
- 반응형 그리드 (auto-fill + minmax)

## client와 공유하는 것

- 동일 기술 스택 (Next.js, React, styled-components, Jotai, React Query, Axios)
- 동일 백엔드 API (포트 5001)
- 동일 WebSocket 서버
- 동일 뱃지 체계 (추천, 사장님 추천, 인기, 시그니처, BEST, NEW)
- 별도 node_modules (모노레포 아님)
