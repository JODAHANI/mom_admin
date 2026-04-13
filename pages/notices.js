import { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import {
  useNotices,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice,
} from '../hooks/useNotices';

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

const AddForm = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  align-items: flex-start;
`;

const Textarea = styled.textarea`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;

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
  align-items: flex-start;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const NoticeContent = styled.div`
  flex: 1;
  font-size: 15px;
  color: #1b1d1f;
  white-space: pre-wrap;
  line-height: 1.5;
`;

const NoticeDate = styled.div`
  font-size: 12px;
  color: #8b95a1;
  margin-top: 4px;
`;

const EditTextarea = styled.textarea`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #3182f6;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
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
    background: #F5F6F8;
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
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function NoticesPage() {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const showToast = useToast();
  const { data: notices = [] } = useNotices();
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();

  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const noticesList = Array.isArray(notices) ? notices : notices?.data || [];

  const handleAdd = () => {
    if (!newContent.trim()) return;
    createNotice.mutate(
      { content: newContent.trim() },
      {
        onSuccess: () => {
          showToast('공지사항이 추가되었습니다', 'success');
          queryClient.invalidateQueries({ queryKey: ['notices'] });
        },
      }
    );
    setNewContent('');
  };

  const handleEdit = (notice) => {
    setEditingId(notice._id || notice.id);
    setEditingContent(notice.content);
  };

  const handleSaveEdit = () => {
    if (!editingContent.trim()) return;
    updateNotice.mutate(
      { id: editingId, content: editingContent.trim() },
      {
        onSuccess: () => {
          showToast('공지사항이 수정되었습니다', 'success');
          queryClient.invalidateQueries({ queryKey: ['notices'] });
        },
      }
    );
    setEditingId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleDelete = (id) => {
    if (window.confirm('이 공지사항을 삭제하시겠습니까?')) {
      deleteNotice.mutate(id, {
        onSuccess: () => {
          showToast('공지사항이 삭제되었습니다', 'success');
          queryClient.invalidateQueries({ queryKey: ['notices'] });
        },
      });
    }
  };

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="notices" />
      <MainArea>
        <Header />
        <Content>
          <PageTitle>공지사항 관리</PageTitle>
          <Container>
            <AddForm>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="새 공지사항 내용을 입력하세요"
              />
              <AddButton onClick={handleAdd}>추가</AddButton>
            </AddForm>
            <List>
              {noticesList.map((notice) => {
                const noticeId = notice._id || notice.id;
                const isEditing = editingId === noticeId;
                return (
                  <Item key={noticeId}>
                    {isEditing ? (
                      <>
                        <EditTextarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          autoFocus
                        />
                        <ButtonGroup>
                          <SaveButton onClick={handleSaveEdit}>저장</SaveButton>
                          <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
                        </ButtonGroup>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <NoticeContent>{notice.content}</NoticeContent>
                          <NoticeDate>{formatDate(notice.createdAt)}</NoticeDate>
                        </div>
                        <ButtonGroup>
                          <ActionButton onClick={() => handleEdit(notice)}>수정</ActionButton>
                          <ActionButton $danger onClick={() => handleDelete(noticeId)}>
                            삭제
                          </ActionButton>
                        </ButtonGroup>
                      </>
                    )}
                  </Item>
                );
              })}
              {noticesList.length === 0 && (
                <EmptyMessage>공지사항이 없습니다</EmptyMessage>
              )}
            </List>
          </Container>
        </Content>
      </MainArea>
    </PageContainer>
  );
}
