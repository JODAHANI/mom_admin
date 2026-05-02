import styled from 'styled-components';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ProductForm from '../../components/ProductForm';
import { useCreateProduct } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.div`
  margin-left: var(--sidebar-width, 240px);
  transition: margin-left 0.25s ease;
  flex: 1;

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

export default function NewProductPage() {
  const router = useRouter();
  const { loading } = useAuth();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data) => {
    await createProduct.mutateAsync(data);
    router.push('/products');
  };

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="products" />
      <MainArea>
        <Content>
          <Header title="상품 추가" />
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/products')}
            loading={createProduct.isPending}
          />
        </Content>
      </MainArea>
    </PageContainer>
  );
}
