import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useCreateOrder } from '../hooks/useOrders';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
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
  height: 88vh;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);

  @media (min-width: 1280px) {
    width: 1120px;
    height: 84vh;
    max-height: 84vh;
  }

  @media (min-width: 1600px) {
    width: 1280px;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  background: white;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e8eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;

  @media (max-width: 768px) {
    padding: 10px 12px;
  }
`;

const Title = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;

  @media (max-width: 768px) {
    font-size: 14.5px;
  }
`;

const CloseBtn = styled.button`
  font-size: 30px;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 10px;
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
  min-height: 0;
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
  gap: 8px;
  flex: 0 0 auto;

  @media (max-width: 768px) {
    padding: 8px 10px;
    gap: 6px;
  }
`;

const SearchInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  -webkit-appearance: none;

  &:focus {
    border-color: #3182f6;
  }

  @media (max-width: 768px) {
    font-size: 16px; /* iOS 자동 줌 방지 */
    padding: 9px 12px;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
`;

const Tab = styled.button`
  padding: 6px 12px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#e5e8eb')};
  border-radius: 999px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex: 0 0 auto;

  &:hover {
    border-color: #3182f6;
  }
`;

const Grid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  align-content: start;
  -webkit-overflow-scrolling: touch;

  @media (min-width: 1024px) {
    padding: 18px;
    gap: 14px;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  @media (min-width: 1440px) {
    padding: 22px;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  @media (max-width: 768px) {
    padding: 10px;
    gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }
`;

const ProductCard = styled.button`
  position: relative;
  background: white;
  border: 1px solid ${(p) => (p.$inCart ? '#3182F6' : '#e5e8eb')};
  border-radius: 10px;
  padding: 0;
  overflow: hidden;
  min-height: 92px;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  text-align: left;
  transition: transform 0.1s, box-shadow 0.1s, border-color 0.1s;
  box-shadow: ${(p) => (p.$inCart ? '0 0 0 1px #3182F6 inset' : 'none')};

  @media (min-width: 1024px) {
    min-height: 104px;
  }

  @media (max-width: 768px) {
    min-height: 76px;
    border-radius: 9px;
  }

  &:hover {
    ${(p) => !p.$disabled && 'border-color: #3182f6; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.06);'}
  }

  &:active {
    ${(p) => !p.$disabled && 'transform: scale(0.97);'}
  }
`;

const SoldOutOverlay = styled.div`
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(244, 67, 54, 0.95);
  color: white;
  font-size: 10.5px;
  font-weight: 700;
  z-index: 2;
`;

const QtyBadge = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #3182f6;
  color: white;
  font-size: 11.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(49, 130, 246, 0.35);
  z-index: 2;
  font-variant-numeric: tabular-nums;
`;

const ProductInfo = styled.div`
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: 768px) {
    padding: 8px 9px;
    gap: 3px;
  }
`;

const ProductName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 1024px) {
    font-size: 17px;
  }

  @media (max-width: 768px) {
    font-size: 12.5px;
    line-height: 1.25;
  }
`;

const ProductPrice = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #3182f6;
  font-variant-numeric: tabular-nums;
  margin-top: auto;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const CartPane = styled.div`
  width: 320px;
  background: white;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (min-width: 1280px) {
    width: 380px;
  }

  @media (min-width: 1600px) {
    width: 420px;
  }

  @media (max-width: 768px) {
    width: 100%;
    flex: 0 0 auto;
    max-height: 42vh;
  }
`;

const CartHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e8eb;
  font-size: 14.5px;
  font-weight: 700;
  color: #191f28;
  display: flex;
  justify-content: space-between;
  flex: 0 0 auto;

  @media (max-width: 768px) {
    padding: 8px 14px;
    font-size: 13px;
    ${(p) => p.$hideEmpty && 'display: none;'}
  }
`;

const CartCount = styled.span`
  font-size: 13px;
  color: #8b95a1;
  font-weight: 500;
`;

const CartList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
`;

const CartEmpty = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: #8b95a1;
  font-size: 13px;

  @media (max-width: 768px) {
    padding: 14px 16px;
    font-size: 12px;
  }
`;

const CartItem = styled.div`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;

  & + & {
    border-top: 1px solid #f2f3f5;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    gap: 8px;
  }
`;

const CartInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CartName = styled.div`
  font-size: 13.5px;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const CartPrice = styled.div`
  font-size: 12.5px;
  color: #4e5968;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const QtyBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f5f6f8;
  border-radius: 10px;
  padding: 3px;
  flex: 0 0 auto;
`;

const QtyBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: white;
  border: none;
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;

  &:hover {
    background: #3182f6;
    color: white;
  }

  &:active {
    transform: scale(0.92);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: white;
    color: #191f28;
  }

  @media (min-width: 1024px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 17px;
  }
`;

const QtyNum = styled.div`
  min-width: 24px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: #191f28;
  font-variant-numeric: tabular-nums;
`;

const CartFooter = styled.div`
  border-top: 1px solid #e5e8eb;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 0 auto;
  background: white;

  @media (max-width: 768px) {
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    gap: 8px;
  }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const TotalLabel = styled.div`
  font-size: 13.5px;
  color: #191f28;
  font-weight: 600;
`;

const TotalValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #3182f6;
  font-variant-numeric: tabular-nums;

  @media (max-width: 768px) {
    font-size: 19px;
  }
`;

const SubmitBtn = styled.button`
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: #3182f6;
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #1b6ce5;
  }

  &:disabled {
    background: #c6cdd6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 13px;
    font-size: 15px;
  }
`;

const EmptyGrid = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #8b95a1;
  font-size: 14px;
`;

const VariantOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const VariantModal = styled.div`
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const VariantHeader = styled.div`
  padding: 16px 18px;
  border-bottom: 1px solid #e5e8eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VariantTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
`;

const VariantList = styled.div`
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VariantChoice = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  background: white;
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
  cursor: pointer;
  opacity: ${(p) => (p.$soldOut ? 0.5 : 1)};
  pointer-events: ${(p) => (p.$soldOut ? 'none' : 'auto')};
  touch-action: manipulation;

  &:hover {
    background: #f5f9ff;
    border-color: #c6d4ef;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const VariantPrice = styled.span`
  font-size: 14px;
  color: #4e5968;
  font-weight: 700;
`;

export default function OrderCreateModal({ table, onClose }) {
  useBodyScrollLock();
  const showToast = useToast();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createOrder = useCreateOrder();

  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [variantPicker, setVariantPicker] = useState(null);

  const sameLine = (a, b) =>
    a.productId === b.productId && (a.variantName || '') === (b.variantName || '');

  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? products : products?.data || [];
    return list.filter((p) => {
      if (p.isActive === false) return false;
      if (p.showOnAdminOrder === false) return false;
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

  const productCountMap = useMemo(() => {
    const map = new Map();
    for (const i of cart) {
      map.set(i.productId, (map.get(i.productId) || 0) + i.quantity);
    }
    return map;
  }, [cart]);

  const addToCart = (product) => {
    if (product.isSoldOut) return;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setVariantPicker(product);
      return;
    }
    addLine(product, null);
  };

  const addLine = (product, variant) => {
    const variantName = variant?.name || '';
    const price = variant && variant.price != null ? variant.price : product.price;
    const newLine = {
      productId: product._id,
      name: product.name,
      variantName,
      price,
      quantity: 1,
    };
    setCart((prev) => {
      const existing = prev.find((i) => sameLine(i, newLine));
      if (existing) {
        return prev.map((i) => (sameLine(i, newLine) ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, newLine];
    });
  };

  const handleVariantPick = (variant) => {
    if (!variantPicker || variant.isSoldOut) return;
    addLine(variantPicker, variant);
    setVariantPicker(null);
  };

  const changeQty = (line, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (sameLine(i, line) ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
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
            {table.floor}층 {table.number}번 · 주문 추가
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
                filtered.map((p) => {
                  const count = productCountMap.get(p._id) || 0;
                  return (
                    <ProductCard
                      key={p._id}
                      $disabled={p.isSoldOut}
                      $inCart={count > 0}
                      disabled={p.isSoldOut}
                      onClick={() => addToCart(p)}
                    >
                      {p.isSoldOut && <SoldOutOverlay>품절</SoldOutOverlay>}
                      {count > 0 && <QtyBadge>{count}</QtyBadge>}
                      <ProductInfo>
                        <ProductName>{p.name}</ProductName>
                        <ProductPrice>
                          {Number(p.price || 0).toLocaleString()}원
                        </ProductPrice>
                      </ProductInfo>
                    </ProductCard>
                  );
                })
              )}
            </Grid>
          </LeftPane>

          <CartPane>
            <CartHeader $hideEmpty={cart.length === 0}>
              <span>장바구니</span>
              <CartCount>{itemCount > 0 ? `${itemCount}개` : ''}</CartCount>
            </CartHeader>
            <CartList>
              {cart.length === 0 ? (
                <CartEmpty>메뉴를 선택해주세요</CartEmpty>
              ) : (
                cart.map((item) => (
                  <CartItem key={`${item.productId}|${item.variantName || ''}`}>
                    <CartInfo>
                      <CartName>
                        {item.variantName ? `${item.name} (${item.variantName})` : item.name}
                      </CartName>
                      <CartPrice>
                        {(item.price * item.quantity).toLocaleString()}원
                      </CartPrice>
                    </CartInfo>
                    <QtyBox>
                      <QtyBtn onClick={() => changeQty(item, -1)}>−</QtyBtn>
                      <QtyNum>{item.quantity}</QtyNum>
                      <QtyBtn onClick={() => changeQty(item, 1)}>+</QtyBtn>
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

      {variantPicker && (
        <VariantOverlay onClick={() => setVariantPicker(null)}>
          <VariantModal onClick={(e) => e.stopPropagation()}>
            <VariantHeader>
              <VariantTitle>{variantPicker.name} 종류 선택</VariantTitle>
              <CloseBtn onClick={() => setVariantPicker(null)}>&times;</CloseBtn>
            </VariantHeader>
            <VariantList>
              {(variantPicker.variants || []).map((v) => {
                const price = v.price != null ? v.price : variantPicker.price;
                return (
                  <VariantChoice
                    key={v._id || v.name}
                    $soldOut={v.isSoldOut}
                    onClick={() => handleVariantPick(v)}
                  >
                    <span>
                      {v.name}
                      {v.isSoldOut && ' (품절)'}
                    </span>
                    <VariantPrice>{Number(price || 0).toLocaleString()}원</VariantPrice>
                  </VariantChoice>
                );
              })}
            </VariantList>
          </VariantModal>
        </VariantOverlay>
      )}
    </Overlay>
  );
}
