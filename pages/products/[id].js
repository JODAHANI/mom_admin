import styled from 'styled-components';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ProductForm from '../../components/ProductForm';
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.div`
  margin-left: 240px;
  padding-top: 60px;
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

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1b1d1f;
`;

const DeleteButton = styled.button`
  padding: 8px 20px;
  background: white;
  color: #ff3b30;
  border: 1px solid #ff3b30;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #fff0f0;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #8b95a1;
`;

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { loading: authLoading } = useAuth();
  const showToast = useToast();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const productData = product?.data || product;

  const handleSubmit = async (data) => {
    await updateProduct.mutateAsync({ id, ...data });
    showToast('상품이 저장되었습니다', 'order');
    router.push('/products');
  };

  const handleDelete = async () => {
    if (window.confirm('이 상품을 삭제하시겠습니까?')) {
      await deleteProduct.mutateAsync(id);
      router.push('/products');
    }
  };

  if (authLoading) return null;

  return (
    <PageContainer>
      <Sidebar active="products" />
      <MainArea>
        <Header />
        <Content>
          <TitleRow>
            <PageTitle>상품 수정</PageTitle>
            <DeleteButton onClick={handleDelete}>삭제</DeleteButton>
          </TitleRow>
          {isLoading ? (
            <LoadingState>로딩 중...</LoadingState>
          ) : (
            <ProductForm
              initialData={productData}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/products')}
              loading={updateProduct.isPending}
            />
          )}
        </Content>
      </MainArea>
    </PageContainer>
  );
}
