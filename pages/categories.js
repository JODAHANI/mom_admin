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

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1b1d1f;
`;

export default function CategoriesPage() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="categories" />
      <MainArea>
        <Header />
        <Content>
          <PageTitle>카테고리 관리</PageTitle>
          <CategoryList />
        </Content>
      </MainArea>
    </PageContainer>
  );
}
