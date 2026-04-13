import { useState } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
} from '../hooks/useAdmins';

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

const Container = styled.div`
  max-width: 700px;
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const FormTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1b1d1f;
`;

const FormRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 10px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #3182f6;
  }

  &::placeholder {
    color: #aeb5bc;
  }
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background: #3182f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #1b6ce5;
  }

  &:disabled {
    background: #aeb5bc;
    cursor: not-allowed;
  }
`;

const List = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const AdminInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AdminName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1b1d1f;
`;

const AdminEmail = styled.div`
  font-size: 13px;
  color: #8b95a1;
  margin-top: 2px;
`;

const AdminDate = styled.div`
  font-size: 12px;
  color: #aeb5bc;
  margin-top: 2px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: ${(p) => (p.$danger ? '#FFF0F0' : '#F5F6F8')};
  color: ${(p) => (p.$danger ? '#FF3B30' : '#333')};

  &:hover {
    background: ${(p) => (p.$danger ? '#FFE0E0' : '#ECEDEF')};
  }
`;

const EditRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SaveButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: #3182f6;
  color: white;

  &:hover {
    background: #1b6ce5;
  }
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: white;
  color: #333;

  &:hover {
    background: #f5f6f8;
  }
`;

const EmptyMessage = styled.div`
  padding: 24px;
  text-align: center;
  color: #8b95a1;
  font-size: 15px;
`;

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminsPage() {
  const { loading } = useAuth();
  const showToast = useToast();
  const { data: admins = [] } = useAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const adminsList = Array.isArray(admins) ? admins : admins?.data || [];

  const handleAdd = () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      showToast('아이디와 비밀번호는 필수입니다', 'error');
      return;
    }
    createAdmin.mutate(
      { email: newEmail.trim(), password: newPassword, name: newName.trim() },
      {
        onSuccess: () => {
          showToast('관리자 계정이 생성되었습니다', 'success');
          setNewEmail('');
          setNewPassword('');
          setNewName('');
        },
        onError: (err) => {
          showToast(err.response?.data?.message || '생성 실패', 'error');
        },
      }
    );
  };

  const handleEdit = (admin) => {
    setEditingId(admin._id);
    setEditName(admin.name || '');
    setEditPassword('');
  };

  const handleSaveEdit = () => {
    const data = { id: editingId, name: editName.trim() };
    if (editPassword) data.password = editPassword;

    updateAdmin.mutate(data, {
      onSuccess: () => {
        showToast('관리자 정보가 수정되었습니다', 'success');
        setEditingId(null);
      },
      onError: (err) => {
        showToast(err.response?.data?.message || '수정 실패', 'error');
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPassword('');
  };

  const handleDelete = (id) => {
    if (window.confirm('이 관리자 계정을 삭제하시겠습니까?')) {
      deleteAdmin.mutate(id, {
        onSuccess: () => showToast('관리자 계정이 삭제되었습니다', 'success'),
        onError: (err) => showToast(err.response?.data?.message || '삭제 실패', 'error'),
      });
    }
  };

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="admins" />
      <MainArea>
        <Header />
        <Content>
          <PageTitle>계정 관리</PageTitle>
          <Container>
            <FormCard>
              <FormTitle>새 관리자 추가</FormTitle>
              <FormRow>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="아이디"
                  type="text"
                />
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="비밀번호"
                  type="password"
                />
              </FormRow>
              <FormRow>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="이름 (선택)"
                />
                <AddButton onClick={handleAdd} disabled={createAdmin.isPending}>
                  추가
                </AddButton>
              </FormRow>
            </FormCard>

            <List>
              {adminsList.map((admin) => {
                const isEditing = editingId === admin._id;
                return (
                  <Item key={admin._id}>
                    {isEditing ? (
                      <>
                        <EditRow>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="이름"
                            style={{ flex: 1 }}
                          />
                          <Input
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="새 비밀번호 (미입력시 유지)"
                            type="password"
                            style={{ flex: 1 }}
                          />
                        </EditRow>
                        <ButtonGroup>
                          <SaveButton onClick={handleSaveEdit}>저장</SaveButton>
                          <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
                        </ButtonGroup>
                      </>
                    ) : (
                      <>
                        <AdminInfo>
                          <AdminName>{admin.name || '(이름 없음)'}</AdminName>
                          <AdminEmail>{admin.email}</AdminEmail>
                          <AdminDate>가입일: {formatDate(admin.createdAt)}</AdminDate>
                        </AdminInfo>
                        <ButtonGroup>
                          <ActionButton onClick={() => handleEdit(admin)}>수정</ActionButton>
                          <ActionButton $danger onClick={() => handleDelete(admin._id)}>
                            삭제
                          </ActionButton>
                        </ButtonGroup>
                      </>
                    )}
                  </Item>
                );
              })}
              {adminsList.length === 0 && (
                <EmptyMessage>등록된 관리자가 없습니다</EmptyMessage>
              )}
            </List>
          </Container>
        </Content>
      </MainArea>
    </PageContainer>
  );
}
