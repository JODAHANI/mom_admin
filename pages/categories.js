import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import CategoryList from "../components/CategoryList";
import { useAuth } from "../hooks/useAuth";

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

export default function CategoriesPage() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="categories" />
      <MainArea>
        <Content>
          <Header title="카테고리 관리" />
          <CategoryList />
        </Content>
      </MainArea>
    </PageContainer>
  );
}
