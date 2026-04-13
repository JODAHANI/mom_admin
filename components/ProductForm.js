import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Toggle from './Toggle';
import { useCategories } from '../hooks/useCategories';
import api from '../lib/api';

const Form = styled.form`
  max-width: 600px;
`;

const FieldGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  color: #8b95a1;
  margin-bottom: 4px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3182f6;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    border-color: #3182f6;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  background: white;
  box-sizing: border-box;

  &:focus {
    border-color: #3182f6;
  }
`;

const ImageUpload = styled.div`
  width: 100%;
  height: 200px;
  border: 2px dashed #e5e8eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b95a1;
  font-size: 14px;
  cursor: pointer;
  overflow: hidden;
  position: relative;

  &:hover {
    border-color: #3182f6;
  }
`;


const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const UploadingText = styled.span`
  color: #3182f6;
  font-weight: 600;
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 16px;
`;

const BadgeLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1b1d1f;
  cursor: pointer;
`;

const ToggleField = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  color: #1b1d1f;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 32px;
`;

const PrimaryButton = styled.button`
  padding: 10px 32px;
  background: #3182f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1b6ce5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: 10px 32px;
  background: white;
  color: #333;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: #f5f6f8;
  }
`;


export default function ProductForm({ initialData, onSubmit, onCancel, loading }) {
  const { data: categories = [] } = useCategories();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    categoryIds: [],
    badges: [],
    kioskVisible: true,
    tableVisible: true,
  });

  useEffect(() => {
    if (initialData) {
      const ids = (initialData.categoryIds || []).map((c) => c._id || c);
      setForm({
        name: initialData.name || '',
        price: initialData.price?.toString() || '',
        description: initialData.description || '',
        image: initialData.image || '',
        categoryIds: ids,
        badges: initialData.badges || [],
        kioskVisible: initialData.kioskVisible !== false,
        tableVisible: initialData.tableVisible !== false,
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (catId) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      alert('이미지 업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  const handleBadgeChange = (badge) => {
    setForm((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter((b) => b !== badge)
        : [...prev.badges, badge],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price),
    });
  };

  const categoriesList = Array.isArray(categories) ? categories : categories?.data || [];

  return (
    <Form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label>메뉴명</Label>
        <Input
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="메뉴명을 입력하세요"
          required
        />
      </FieldGroup>

      <FieldGroup>
        <Label>가격</Label>
        <Input
          type="number"
          value={form.price}
          onChange={(e) => handleChange('price', e.target.value)}
          placeholder="0"
          required
        />
      </FieldGroup>

      <FieldGroup>
        <Label>설명</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="상품 설명을 입력하세요"
        />
      </FieldGroup>

      <FieldGroup>
        <Label>카테고리 (복수 선택 가능)</Label>
        <BadgeGroup>
          {categoriesList.map((cat) => {
            const catId = cat._id || cat.id;
            return (
              <BadgeLabel key={catId}>
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(catId)}
                  onChange={() => handleCategoryToggle(catId)}
                />
                {cat.name}
              </BadgeLabel>
            );
          })}
        </BadgeGroup>
      </FieldGroup>

      <FieldGroup>
        <Label>뱃지</Label>
        <BadgeGroup>
          {['추천', '사장님 추천', '인기', '시그니처', 'BEST', 'NEW'].map((badge) => (
            <BadgeLabel key={badge}>
              <input
                type="checkbox"
                checked={form.badges.includes(badge)}
                onChange={() => handleBadgeChange(badge)}
              />
              {badge}
            </BadgeLabel>
          ))}
        </BadgeGroup>
      </FieldGroup>

      <FieldGroup>
        <Label>이미지</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <ImageUpload onClick={() => fileInputRef.current?.click()}>
          {uploading ? (
            <UploadingText>업로드 중...</UploadingText>
          ) : form.image ? (
            <PreviewImage src={form.image} alt="상품 이미지" />
          ) : (
            '클릭하여 이미지 업로드'
          )}
        </ImageUpload>
      </FieldGroup>

      <ToggleField>
        <ToggleLabel>키오스크 노출</ToggleLabel>
        <Toggle
          checked={form.kioskVisible}
          onChange={(v) => handleChange('kioskVisible', v)}
        />
      </ToggleField>

      <ToggleField>
        <ToggleLabel>테이블주문 노출</ToggleLabel>
        <Toggle
          checked={form.tableVisible}
          onChange={(v) => handleChange('tableVisible', v)}
        />
      </ToggleField>

      <ButtonRow>
        <PrimaryButton type="submit" disabled={loading}>
          저장
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          취소
        </SecondaryButton>
      </ButtonRow>
    </Form>
  );
}
