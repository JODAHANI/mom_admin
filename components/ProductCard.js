import styled from 'styled-components';
import { useRouter } from 'next/router';
import Toggle from './Toggle';
import { useToggleSoldOut, useToggleChannel } from '../hooks/useProducts';

const Card = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const ImageArea = styled.div`
  height: 160px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const BadgeRow = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  z-index: 1;
`;

const Badge = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
`;

const CategoryTag = styled.span`
  font-size: 12px;
  color: #8b95a1;
  margin-bottom: 2px;
  display: block;
`;

const PlaceholderImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
`;

const PlaceholderText = styled.span`
  color: #c4c4c4;
  font-size: 14px;
`;

const Content = styled.div`
  padding: 12px;
`;

const Name = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #1b1d1f;
  margin-bottom: 4px;
`;

const Price = styled.div`
  font-size: 14px;
  color: #8b95a1;
`;

const ToggleRow = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const OrderRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
`;

const ArrowBtn = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #666;

  &:hover {
    background: #f5f6f8;
    color: #333;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
    &:hover { background: white; color: #666; }
  }
`;


const badgeStyles = {
  '추천': { bg: '#E8F0FE', color: '#3182F6' },
  '사장님 추천': { bg: '#FFF8E1', color: '#F59E0B' },
  '인기': { bg: '#FFF3E0', color: '#FF9500' },
  '시그니처': { bg: '#F3E8FF', color: '#8B5CF6' },
  'BEST': { bg: '#FFEBEE', color: '#FF3B30' },
  'NEW': { bg: '#E8F5E9', color: '#4CAF50' },
};

export default function ProductCard({ product, onMoveUp, onMoveDown, isFirst, isLast }) {
  const router = useRouter();
  const toggleSoldOut = useToggleSoldOut();
  const toggleChannel = useToggleChannel();

  const handleCardClick = () => {
    router.push(`/products/${product._id || product.id}`);
  };

  return (
    <Card onClick={handleCardClick}>
      <ImageArea>
        {(product.badges || []).length > 0 && (
          <BadgeRow>
            {product.badges.map((badge) => {
              const style = badgeStyles[badge] || { bg: '#F0F0F0', color: '#666' };
              return <Badge key={badge} $bg={style.bg} $color={style.color}>{badge}</Badge>;
            })}
          </BadgeRow>
        )}
        {product.image ? (
          <PlaceholderImg src={product.image} alt={product.name} />
        ) : (
          <PlaceholderText>이미지 없음</PlaceholderText>
        )}
      </ImageArea>
      <Content>
        {(product.categoryIds || []).length > 0 && (
          <CategoryTag>
            {product.categoryIds.map((c) => c.name || c).join(', ')}
          </CategoryTag>
        )}
        <Name>{product.name}</Name>
        <Price>{Number(product.price).toLocaleString()}원</Price>
        <ToggleRow>
          <Toggle
            label="품절"
            checked={product.isSoldOut}
            onChange={() => toggleSoldOut.mutate(product._id || product.id)}
            size="sm"
            color="#FF3B30"
          />
          <Toggle
            label="테이블주문"
            checked={product.tableVisible !== false}
            onChange={() =>
              toggleChannel.mutate({
                id: product._id || product.id,
                channel: 'table',
              })
            }
            size="sm"
          />
        </ToggleRow>
        {onMoveUp && onMoveDown && (
          <OrderRow>
            <ArrowBtn disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>&#9664;</ArrowBtn>
            <ArrowBtn disabled={isLast} onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>&#9654;</ArrowBtn>
          </OrderRow>
        )}
      </Content>
    </Card>
  );
}
