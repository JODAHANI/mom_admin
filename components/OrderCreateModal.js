import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useCreateOrder } from '../hooks/useOrders';
import { useToast } from './Toast';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const Modal = styled.div`
  background: #f5f6f8;
  border-radius: 16px;
  width: 960px;
  max-width: calc(100vw - 24px);
  height: 85vh;
  max-height: 720px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e8eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;
`;

const CloseBtn = styled.button`
  font-size: 24px;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;

  &:hover {
    color: #191f28;
  }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftPane = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e8eb;
  background: #f5f6f8;

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid #e5e8eb;
  }
`;

const Controls = styled.div`
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e8eb;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SearchInput = styled.input`
  padding: 9px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #3182f6;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button`
  padding: 6px 14px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#e5e8eb')};
  border-radius: 999px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: #3182f6;
  }
`;

const Grid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  align-content: start;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
`;

const ProductCard = styled.button`
  position: relative;
  background: white;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  text-align: left;
  transition: transform 0.1s, box-shadow 0.1s, border-color 0.1s;

  &:hover {
    ${(p) => !p.$disabled && 'border-color: #3182f6; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.06);'}
  }

  &:active {
    ${(p) => !p.$disabled && 'transform: translateY(0);'}
  }
`;

const ProductImg = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: #f0f2f4 url(${(p) => p.$src || ''}) center/cover no-repeat;
`;

const SoldOutOverlay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(244, 67, 54, 0.95);
  color: white;
  font-size: 11px;
  font-weight: 700;
`;

const ProductInfo = styled.div`
  padding: 10px 12px;
`;

const ProductName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.3;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductPrice = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #3182f6;
  font-variant-numeric: tabular-nums;
`;

const CartPane = styled.div`
  width: 320px;
  background: white;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    max-height: 45vh;
  }
`;

const CartHeader = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid #e5e8eb;
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
  display: flex;
  justify-content: space-between;
`;

const CartCount = styled.span`
  font-size: 13px;
  color: #8b95a1;
  font-weight: 500;
`;

const CartList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const CartEmpty = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #8b95a1;
  font-size: 13px;
`;

const CartItem = styled.div`
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;

  & + & {
    border-top: 1px solid #f2f3f5;
  }
`;

const CartInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CartName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #191f28;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CartPrice = styled.div`
  font-size: 12px;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const QtyBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f5f6f8;
  border-radius: 8px;
  padding: 2px;
`;

const QtyBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: white;
  border: none;
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #3182f6;
    color: white;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: white;
    color: #191f28;
  }
`;

const QtyNum = styled.div`
  min-width: 22px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #191f28;
  font-variant-numeric: tabular-nums;
`;

const CartFooter = styled.div`
  border-top: 1px solid #e5e8eb;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const TotalLabel = styled.div`
  font-size: 14px;
  color: #191f28;
  font-weight: 600;
`;

const TotalValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #3182f6;
  font-variant-numeric: tabular-nums;
`;

const SubmitBtn = styled.button`
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #3182f6;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #1b6ce5;
  }

  &:disabled {
    background: #c6cdd6;
    cursor: not-allowed;
  }
`;

const EmptyGrid = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #8b95a1;
  font-size: 14px;
`;

export default function OrderCreateModal({ table, onClose }) {
  const showToast = useToast();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createOrder = useCreateOrder();

  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? products : products?.data || [];
    return list.filter((p) => {
      if (p.isActive === false) return false;
      if (categoryId !== 'all') {
        const ids = (p.categoryIds || []).map((c) => (typeof c === 'object' ? c._id : c));
        if (!ids.includes(categoryId)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!p.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, categoryId, search]);

  const addToCart = (product) => {
    if (product.isSoldOut) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const changeQty = (productId, delta) => {
    setCart((prev) => {
      const next = prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0);
      return next;
    });
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSubmit = () => {
    if (cart.length === 0 || createOrder.isPending) return;
    createOrder.mutate(
      {
        tableId: table._id,
        tableNumber: table.number,
        floor: table.floor,
        items: cart,
        sessionStartedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          showToast(
            `${table.floor}층 ${table.number}번 테이블 주문이 추가되었습니다`,
            'success'
          );
          onClose();
        },
        onError: (err) => {
          showToast(
            err?.response?.data?.message || '주문 추가에 실패했습니다',
            'error'
          );
        },
      }
    );
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories]
  );

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            {table.floor}층 {table.number}번 테이블 · 주문 추가
          </Title>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>
        </Header>
        <Body>
          <LeftPane>
            <Controls>
              <SearchInput
                type="text"
                placeholder="메뉴 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Tabs>
                <Tab
                  $active={categoryId === 'all'}
                  onClick={() => setCategoryId('all')}
                >
                  전체
                </Tab>
                {sortedCategories.map((c) => (
                  <Tab
                    key={c._id}
                    $active={categoryId === c._id}
                    onClick={() => setCategoryId(c._id)}
                  >
                    {c.name}
                  </Tab>
                ))}
              </Tabs>
            </Controls>
            <Grid>
              {productsLoading ? (
                <EmptyGrid>로딩 중...</EmptyGrid>
              ) : filtered.length === 0 ? (
                <EmptyGrid>메뉴가 없습니다</EmptyGrid>
              ) : (
                filtered.map((p) => (
                  <ProductCard
                    key={p._id}
                    $disabled={p.isSoldOut}
                    disabled={p.isSoldOut}
                    onClick={() => addToCart(p)}
                  >
                    <ProductImg $src={p.image} />
                    {p.isSoldOut && <SoldOutOverlay>품절</SoldOutOverlay>}
                    <ProductInfo>
                      <ProductName>{p.name}</ProductName>
                      <ProductPrice>
                        {Number(p.price || 0).toLocaleString()}원
                      </ProductPrice>
                    </ProductInfo>
                  </ProductCard>
                ))
              )}
            </Grid>
          </LeftPane>
          <CartPane>
            <CartHeader>
              <span>장바구니</span>
              <CartCount>{itemCount > 0 ? `${itemCount}개` : ''}</CartCount>
            </CartHeader>
            <CartList>
              {cart.length === 0 ? (
                <CartEmpty>메뉴를 선택해주세요</CartEmpty>
              ) : (
                cart.map((item) => (
                  <CartItem key={item.productId}>
                    <CartInfo>
                      <CartName>{item.name}</CartName>
                      <CartPrice>
                        {(item.price * item.quantity).toLocaleString()}원
                      </CartPrice>
                    </CartInfo>
                    <QtyBox>
                      <QtyBtn onClick={() => changeQty(item.productId, -1)}>
                        −
                      </QtyBtn>
                      <QtyNum>{item.quantity}</QtyNum>
                      <QtyBtn onClick={() => changeQty(item.productId, 1)}>
                        +
                      </QtyBtn>
                    </QtyBox>
                  </CartItem>
                ))
              )}
            </CartList>
            <CartFooter>
              <TotalRow>
                <TotalLabel>합계</TotalLabel>
                <TotalValue>{total.toLocaleString()}원</TotalValue>
              </TotalRow>
              <SubmitBtn
                onClick={handleSubmit}
                disabled={cart.length === 0 || createOrder.isPending}
              >
                {createOrder.isPending
                  ? '주문 넣는 중...'
                  : `주문하기${cart.length > 0 ? ` (${itemCount}개)` : ''}`}
              </SubmitBtn>
            </CartFooter>
          </CartPane>
        </Body>
      </Modal>
    </Overlay>
  );
}
