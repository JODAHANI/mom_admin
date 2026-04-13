import { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useProducts, useReorderProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { searchQueryAtom } from '../store/atoms';
import { useToast } from '../components/Toast';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.div`
  margin-left: 240px;
  padding-top: 60px;
  flex: 1;
  min-height: 100vh;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Content = styled.div`
  padding: 24px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  padding: 10px 14px;
  border: 1px solid #E5E8EB;
  border-radius: 8px;
  font-size: 14px;
  width: 300px;
  outline: none;
  background: white;

  &:focus {
    border-color: #3182F6;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background: #3182F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1b6ce5;
  }
`;

const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 8px 16px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#E5E8EB')};
  border-radius: 20px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3182F6;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #8b95a1;
  font-size: 15px;
`;

export default function ProductsPage() {
  const router = useRouter();
  const { loading } = useAuth();
  const showToast = useToast();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const { data: products = [], isLoading: productsLoading } = useProducts(
    selectedCategory,
    searchQuery
  );
  const reorderProducts = useReorderProducts();
  const { data: categories = [] } = useCategories();

  const categoriesList = Array.isArray(categories)
    ? categories
    : categories?.data || [];
  const productsList = Array.isArray(products)
    ? products
    : products?.data || [];

  const handleMoveProduct = (index, direction) => {
    const newList = [...productsList];
    const targetIndex = index + direction;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    const ids = newList.map((p) => p._id || p.id);
    reorderProducts.mutate(ids, {
      onSuccess: () => showToast('순서가 변경되었습니다', 'success'),
    });
  };

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="products" />
      <MainArea>
        <Header />
        <Content>
          <TopBar>
            <SearchInput
              placeholder="상품명으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <AddButton onClick={() => router.push('/products/new')}>
              + 상품 추가
            </AddButton>
          </TopBar>
          <TabsRow>
            <Tab
              $active={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            >
              전체
            </Tab>
            {categoriesList.map((cat) => (
              <Tab
                key={cat._id || cat.id}
                $active={selectedCategory === (cat._id || cat.id)}
                onClick={() => setSelectedCategory(cat._id || cat.id)}
              >
                {cat.name}
              </Tab>
            ))}
          </TabsRow>
          {productsLoading ? (
            <EmptyState>로딩 중...</EmptyState>
          ) : productsList.length === 0 ? (
            <EmptyState>등록된 상품이 없습니다</EmptyState>
          ) : (
            <ProductGrid>
              {productsList.map((product, index) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  isFirst={index === 0}
                  isLast={index === productsList.length - 1}
                  onMoveUp={() => handleMoveProduct(index, -1)}
                  onMoveDown={() => handleMoveProduct(index, 1)}
                />
              ))}
            </ProductGrid>
          )}
        </Content>
      </MainArea>
    </PageContainer>
  );
}
