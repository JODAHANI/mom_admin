import { useState } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import {
  useCallItems,
  useCreateCallItem,
  useUpdateCallItem,
  useDeleteCallItem,
  useReorderCallItems,
} from '../hooks/useCallItems';

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

const Container = styled.div`
  max-width: 640px;
`;

const Description = styled.p`
  color: #6b7684;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 18px;
`;

const AddForm = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  outline: none;

  &:focus {
    border-color: #3182f6;
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

  &:hover { background: #1b6ce5; }
  &:disabled { background: #c6d4ef; cursor: not-allowed; }
`;

const List = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
  gap: 10px;

  &:last-child { border-bottom: none; }
`;

const OrderControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ArrowBtn = styled.button`
  width: 26px;
  height: 22px;
  border: 1px solid #e5e8eb;
  background: #fff;
  color: #4e5968;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled) { background: #f5f6f8; }
  &:disabled { color: #d1d6db; cursor: not-allowed; }
`;

const NameText = styled.div`
  flex: 1;
  font-size: 15px;
  color: #1b1d1f;
  font-weight: 600;
`;

const EditInput = styled.input`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #3182f6;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: ${(p) => (p.$danger ? '#FFF0F0' : '#F5F6F8')};
  color: ${(p) => (p.$danger ? '#FF3B30' : '#333')};

  &:hover { background: ${(p) => (p.$danger ? '#FFE0E0' : '#ECEDEF')}; }
`;

const SaveButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: #3182f6;
  color: white;

  &:hover { background: #1b6ce5; }
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: white;
  color: #333;

  &:hover { background: #f5f6f8; }
`;

const EmptyMessage = styled.div`
  padding: 24px;
  text-align: center;
  color: #8b95a1;
  font-size: 14px;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #E5E8EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const CloseBtn = styled.button`
  font-size: 32px;
  line-height: 1;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 10px;

  &:hover {
    color: #191f28;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ConfirmQuestion = styled.div`
  font-size: 15px;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.5;
`;

const ConfirmHint = styled.div`
  font-size: 12px;
  color: #8b95a1;
  text-align: center;
  margin-bottom: 8px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #E5E8EB;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
`;

const CancelConfirmBtn = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #E5E8EB;
  border-radius: 10px;
  background: white;
  color: #333;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #F5F6F8;
  }
`;

const DeleteConfirmBtn = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 10px;
  background: #F44336;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #D32F2F;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export default function CallItemsPage() {
  const { loading } = useAuth();
  const showToast = useToast();
  const { data: items = [] } = useCallItems();
  const createItem = useCreateCallItem();
  const updateItem = useUpdateCallItem();
  const deleteItem = useDeleteCallItem();
  const reorderItems = useReorderCallItems();

  const list = Array.isArray(items) ? items : items?.data || [];

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createItem.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          showToast('호출 아이템이 추가되었습니다', 'success');
          setNewName('');
        },
        onError: (err) => {
          const msg = err?.response?.data?.message || '추가에 실패했습니다';
          showToast(msg, 'error');
        },
      }
    );
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditingName(item.name);
  };

  const handleSaveEdit = () => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    updateItem.mutate(
      { id: editingId, name: trimmed },
      {
        onSuccess: () => {
          showToast('항목이 수정되었습니다', 'success');
          setEditingId(null);
          setEditingName('');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (item) => {
    setConfirmDeleteItem(item);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteItem) return;
    deleteItem.mutate(confirmDeleteItem._id, {
      onSuccess: () => {
        showToast('항목이 삭제되었습니다', 'success');
        setConfirmDeleteItem(null);
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || '삭제에 실패했습니다';
        showToast(msg, 'error');
      },
    });
  };

  const move = (index, direction) => {
    const next = index + direction;
    if (next < 0 || next >= list.length) return;
    const newOrder = [...list];
    [newOrder[index], newOrder[next]] = [newOrder[next], newOrder[index]];
    reorderItems.mutate(newOrder.map((it) => it._id));
  };

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="call-items" />
      <MainArea>
        <Content>
          <Header title="호출 아이템 관리" />
          <Container>
            <Description>
              고객 화면에서 직원 호출 시 선택할 수 있는 항목입니다. 위에 있는 항목이 먼저 표시됩니다.
            </Description>

            <AddForm>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
                placeholder="예: 물, 냅킨, 수저, 앞접시"
              />
              <AddButton onClick={handleAdd} disabled={!newName.trim() || createItem.isPending}>
                추가
              </AddButton>
            </AddForm>

            <List>
              {list.map((item, index) => {
                const isEditing = editingId === item._id;
                return (
                  <Item key={item._id}>
                    <OrderControls>
                      <ArrowBtn
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || reorderItems.isPending}
                        aria-label="위로"
                      >
                        ▲
                      </ArrowBtn>
                      <ArrowBtn
                        onClick={() => move(index, 1)}
                        disabled={index === list.length - 1 || reorderItems.isPending}
                        aria-label="아래로"
                      >
                        ▼
                      </ArrowBtn>
                    </OrderControls>

                    {isEditing ? (
                      <>
                        <EditInput
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <ButtonGroup>
                          <SaveButton onClick={handleSaveEdit}>저장</SaveButton>
                          <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
                        </ButtonGroup>
                      </>
                    ) : (
                      <>
                        <NameText>{item.name}</NameText>
                        <ButtonGroup>
                          <ActionButton onClick={() => handleEdit(item)}>수정</ActionButton>
                          <ActionButton $danger onClick={() => handleDelete(item)}>
                            삭제
                          </ActionButton>
                        </ButtonGroup>
                      </>
                    )}
                  </Item>
                );
              })}
              {list.length === 0 && <EmptyMessage>등록된 호출 아이템이 없습니다</EmptyMessage>}
            </List>
          </Container>
        </Content>
      </MainArea>
      {confirmDeleteItem && (
        <Overlay onClick={() => !deleteItem.isPending && setConfirmDeleteItem(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>호출 아이템 삭제</ModalTitle>
              <CloseBtn
                onClick={() => !deleteItem.isPending && setConfirmDeleteItem(null)}
              >
                &times;
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmQuestion>
                &quot;{confirmDeleteItem.name}&quot; 항목을 삭제하시겠습니까?
              </ConfirmQuestion>
              <ConfirmHint>고객 화면에서 더 이상 표시되지 않습니다</ConfirmHint>
            </ModalBody>
            <ModalFooter>
              <CancelConfirmBtn
                onClick={() => setConfirmDeleteItem(null)}
                disabled={deleteItem.isPending}
              >
                취소
              </CancelConfirmBtn>
              <DeleteConfirmBtn onClick={handleConfirmDelete} disabled={deleteItem.isPending}>
                {deleteItem.isPending ? '삭제 중...' : '삭제'}
              </DeleteConfirmBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </PageContainer>
  );
}
