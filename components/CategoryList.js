import { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '../hooks/useCategories';
import { useToast } from './Toast';

const Container = styled.div`
  max-width: 700px;
`;

const AddForm = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
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

  &:hover {
    background: #1b6ce5;
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
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const OrderNumber = styled.span`
  color: #8b95a1;
  font-size: 14px;
  width: 40px;
  flex-shrink: 0;
`;

const Name = styled.span`
  font-size: 15px;
  color: #1b1d1f;
  flex: 1;
`;

const EditInput = styled.input`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #3182f6;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-left: 8px;
  background: ${(p) => (p.$danger ? '#FFF0F0' : '#F5F6F8')};
  color: ${(p) => (p.$danger ? '#FF3B30' : '#333')};

  &:hover {
    background: ${(p) => (p.$danger ? '#FFE0E0' : '#ECEDEF')};
  }
`;

const SaveButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-left: 8px;
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
  margin-left: 8px;
  background: white;
  color: #333;

  &:hover {
    background: #f5f6f8;
  }
`;

const ArrowButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  margin-left: 4px;

  &:hover {
    background: #f5f6f8;
    color: #333;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
    &:hover {
      background: white;
      color: #666;
    }
  }
`;

export default function CategoryList() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  const showToast = useToast();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const categoriesList = Array.isArray(categories)
    ? categories
    : categories?.data || [];

  const handleAdd = () => {
    if (!newName.trim()) return;
    createCategory.mutate({ name: newName.trim() }, {
      onSuccess: () => {
        showToast('카테고리가 추가되었습니다', 'success');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      },
    });
    setNewName('');
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id || cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) return;
    updateCategory.mutate({ id: editingId, name: editingName.trim() }, {
      onSuccess: () => {
        showToast('카테고리가 수정되었습니다', 'success');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      },
    });
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id) => {
    if (window.confirm('이 카테고리를 삭제하시겠습니까?')) {
      deleteCategory.mutate(id, {
        onSuccess: () => {
          showToast('카테고리가 삭제되었습니다', 'success');
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
      });
    }
  };

  const handleMove = (index, direction) => {
    const newList = [...categoriesList];
    const targetIndex = index + direction;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    const ids = newList.map((c) => c._id || c.id);
    reorderCategories.mutate(ids, {
      onSuccess: () => showToast('순서가 변경되었습니다', 'success'),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  return (
    <Container>
      <AddForm>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새 카테고리 이름"
        />
        <AddButton onClick={handleAdd}>추가</AddButton>
      </AddForm>
      <List>
        {categoriesList.map((cat, index) => {
          const catId = cat._id || cat.id;
          const isEditing = editingId === catId;
          return (
            <Item key={catId}>
              <OrderNumber>{index + 1}</OrderNumber>
              {isEditing ? (
                <>
                  <EditInput
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                  <SaveButton onClick={handleSaveEdit}>저장</SaveButton>
                  <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
                </>
              ) : (
                <>
                  <Name>{cat.name}</Name>
                  <ArrowButton disabled={index === 0} onClick={() => handleMove(index, -1)}>&#9650;</ArrowButton>
                  <ArrowButton disabled={index === categoriesList.length - 1} onClick={() => handleMove(index, 1)}>&#9660;</ArrowButton>
                  <ActionButton onClick={() => handleEdit(cat)}>수정</ActionButton>
                  <ActionButton $danger onClick={() => handleDelete(catId)}>
                    삭제
                  </ActionButton>
                </>
              )}
            </Item>
          );
        })}
        {categoriesList.length === 0 && (
          <Item>
            <Name style={{ color: '#8B95A1', textAlign: 'center' }}>
              카테고리가 없습니다
            </Name>
          </Item>
        )}
      </List>
    </Container>
  );
}
