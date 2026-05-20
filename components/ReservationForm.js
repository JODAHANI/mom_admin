import { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseReservationVoice } from '../lib/parseReservationVoice';
import { formatPhone, stripPhone } from '../lib/phone';
import { useToast } from './Toast';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.5); }
  70% { box-shadow: 0 0 0 16px rgba(255, 59, 48, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const chipPop = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;


const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;

  @media (max-width: 768px) {
    padding: 0;
    align-items: stretch;
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 720px;
  max-width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);

  @media (max-width: 768px) {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e5e8eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 14px 16px;
  }
`;

const Title = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;
`;

const CloseBtn = styled.button`
  font-size: 30px;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 6px;
  line-height: 1;

  &:hover { color: #191f28; }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const VoiceBox = styled.div`
  background: #f5f6f8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    padding: 14px;
    margin-bottom: 16px;
  }
`;

const VoiceTop = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const MicBtn = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: ${(p) => (p.$listening ? '#FF3B30' : '#3182F6')};
  color: white;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: ${(p) => (p.$listening ? pulse : 'none')} 1.4s infinite;
  transition: background 0.2s;

  &:disabled {
    background: #c8cdd2;
    cursor: not-allowed;
    animation: none;
  }

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
`;

const VoiceInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const VoiceLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 4px;
`;

const VoiceHint = styled.div`
  font-size: 12px;
  color: #8b95a1;
  line-height: 1.5;
`;

const TranscriptBox = styled.div`
  margin-top: 12px;
  background: white;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #191f28;
  min-height: 44px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Interim = styled.span`
  color: #8b95a1;
`;

const ParsedPreview = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ParsedChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1B1D1F;
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
  animation: ${chipPop} 0.2s ease;

  &:hover { background: #2F3133; }
`;

const ChipEdit = styled.span`
  font-size: 11px;
  opacity: 0.65;
  font-weight: 500;
`;

const SkipRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`;

const SkipBtn = styled.button`
  background: none;
  border: none;
  color: #4B5563;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
  padding: 10px 12px;

  &:hover { color: #1B1D1F; }
`;

const WizardCard = styled.div`
  background: white;
  border: 1px solid #e5e8eb;
  border-radius: 14px;
  padding: 20px;
  margin-top: 4px;
  animation: ${slideIn} 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
  }
`;

const WizardLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #8B95A1;
  margin-bottom: 6px;
`;

const WizardTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #1B1D1F;
  margin-bottom: 16px;
`;

const WizardBody = styled.div`
  margin-bottom: 16px;
`;

const WizardActions = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const ActionBtn = styled.button`
  flex: 1;
  padding: 12px 20px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;

  ${(p) => p.$variant === 'primary' && `
    background: #1B1D1F;
    color: white;
    &:hover { background: #2F3133; }
    &:disabled { background: #c8cdd2; cursor: not-allowed; }
  `}
  ${(p) => p.$variant === 'save' && `
    background: #3182F6;
    color: white;
    &:hover { background: #1B64DA; }
    &:disabled { background: #c8cdd2; cursor: not-allowed; }
  `}
  ${(p) => p.$variant === 'secondary' && `
    background: white;
    color: #4B5563;
    border-color: #e5e8eb;
    &:hover { border-color: #c8cdd2; color: #1B1D1F; }
  `}
  ${(p) => p.$variant === 'danger' && `
    background: white;
    color: #FF3B30;
    border-color: #FFCCC7;
    &:hover { background: #FFF1F0; }
  `}
`;

const DoneNote = styled.div`
  background: #F0FAF1;
  color: #2F7D32;
  font-size: 14px;
  font-weight: 600;
  padding: 14px 16px;
  border-radius: 12px;
  margin-top: 8px;
  text-align: center;
  animation: ${slideIn} 0.28s ease;
`;

const UnsupportedNote = styled.div`
  font-size: 13px;
  color: #FF3B30;
  background: #FFF1F0;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #191f28;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FilledTag = styled.span`
  font-size: 10px;
  font-weight: 700;
  background: #3182F6;
  color: white;
  padding: 2px 6px;
  border-radius: 999px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$filled ? '#3182F6' : '#e5e8eb')};
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;

  &:focus { border-color: #3182F6; }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$filled ? '#3182F6' : '#e5e8eb')};
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
  resize: none;
  height: 100px;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;

  &:focus { border-color: #3182F6; }
`;

const PeopleRow = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const PeopleCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PeopleLabel = styled.div`
  font-size: 11px;
  color: #8b95a1;
`;

const Section = styled.div`
  margin-top: 20px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ItemRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const ItemInput = styled.input`
  flex: 1;
  padding: 9px 10px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  outline: none;
  font-family: inherit;
  min-width: 0;
  flex-basis: 160px;

  &:focus { border-color: #3182F6; }
`;

const StepperWrap = styled.div`
  display: inline-flex;
  align-items: center;
  background: #F4F5F7;
  border-radius: ${(p) => (p.$size === 'sm' ? '10px' : '12px')};
  padding: ${(p) => (p.$size === 'sm' ? '4px' : '6px')};
  gap: ${(p) => (p.$size === 'sm' ? '4px' : '8px')};
  width: ${(p) => (p.$size === 'sm' ? 'auto' : '100%')};
`;

const StepperBtn = styled.button`
  width: ${(p) => (p.$size === 'sm' ? '34px' : '48px')};
  height: ${(p) => (p.$size === 'sm' ? '34px' : '48px')};
  border: none;
  background: white;
  border-radius: ${(p) => (p.$size === 'sm' ? '8px' : '10px')};
  color: #1B1D1F;
  font-size: ${(p) => (p.$size === 'sm' ? '18px' : '24px')};
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: inherit;
  line-height: 1;
  transition: background 0.1s ease, transform 0.05s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &:hover:not(:disabled) {
    background: #FAFBFC;
  }

  &:active:not(:disabled) {
    transform: scale(0.92);
  }

  &:disabled {
    background: transparent;
    color: #C8CDD2;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const StepperValue = styled.div`
  flex: 1;
  text-align: center;
  font-size: ${(p) => (p.$size === 'sm' ? '15px' : '20px')};
  font-weight: 700;
  color: #1B1D1F;
  min-width: ${(p) => (p.$size === 'sm' ? '24px' : '32px')};
  user-select: none;
`;

const IconBtn = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid #e5e8eb;
  background: white;
  color: #8b95a1;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;

  &:hover { color: #FF3B30; border-color: #FF3B30; }
`;

const AddItemBtn = styled.button`
  padding: 8px 14px;
  border: 1px dashed #c8cdd2;
  background: white;
  color: #4B5563;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;

  &:hover { border-color: #3182F6; color: #3182F6; }
`;

const BottomActions = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 20px;
`;

function toLocalYmd(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyForm(date) {
  return {
    customerName: '',
    phone: '',
    reservationDate: date || '',
    reservationTime: '',
    adults: 0,
    children: 0,
    items: [],
    notes: '',
  };
}

const FIELD_ORDER = [
  'customerName',
  'phone',
  'reservationDate',
  'reservationTime',
  'people',
  'items',
  'notes',
];

function isLogicalFilled(key, filled) {
  if (key === 'people') return !!(filled.adults || filled.children);
  return !!filled[key];
}

function logicalChipLabel(key, form) {
  switch (key) {
    case 'customerName': return { title: '이름', value: form.customerName };
    case 'phone': return { title: '연락처', value: formatPhone(form.phone) };
    case 'reservationDate': return { title: '날짜', value: form.reservationDate };
    case 'reservationTime': return { title: '시간', value: form.reservationTime };
    case 'people': {
      const a = Number(form.adults) || 0;
      const c = Number(form.children) || 0;
      if (a > 0 && c > 0) return { title: '인원', value: `성인 ${a} · 아이 ${c}` };
      if (a > 0) return { title: '인원', value: `성인 ${a}` };
      if (c > 0) return { title: '인원', value: `아이 ${c}` };
      return { title: '인원', value: '0' };
    }
    case 'items': {
      const list = form.items || [];
      if (list.length === 0) return { title: '메뉴', value: '없음' };
      const summary = list.slice(0, 2).map((it) => `${it.name}×${it.quantity || 1}`).join(', ');
      const more = list.length > 2 ? ` 외 ${list.length - 2}` : '';
      return { title: '메뉴', value: summary + more };
    }
    case 'notes': return { title: '고객메모', value: (form.notes || '').slice(0, 16) + ((form.notes || '').length > 16 ? '…' : '') };
    default: return { title: key, value: '' };
  }
}

function hasFieldValue(key, form) {
  switch (key) {
    case 'customerName': return !!(form.customerName || '').trim();
    case 'phone': return !!(form.phone || '').trim();
    case 'reservationDate': return !!form.reservationDate;
    case 'reservationTime': return !!form.reservationTime;
    case 'people': return (Number(form.adults) || 0) > 0 || (Number(form.children) || 0) > 0;
    case 'items': return (form.items || []).some((it) => (it.name || '').trim());
    case 'notes': return !!(form.notes || '').trim();
    default: return false;
  }
}

function fieldTitle(key) {
  switch (key) {
    case 'customerName': return '이름을 입력해주세요';
    case 'phone': return '연락처를 입력해주세요';
    case 'reservationDate': return '날짜를 선택해주세요';
    case 'reservationTime': return '시간을 선택해주세요';
    case 'people': return '인원을 입력해주세요';
    case 'items': return '메뉴를 입력해주세요';
    case 'notes': return '고객메모';
    default: return '';
  }
}

function Stepper({ value, onChange, min = 0, max = 99, size = 'lg', ariaLabel }) {
  const num = Math.max(min, Math.min(max, Number(value) || 0));
  const dec = (e) => {
    e?.preventDefault();
    onChange(Math.max(min, num - 1));
  };
  const inc = (e) => {
    e?.preventDefault();
    onChange(Math.min(max, num + 1));
  };
  return (
    <StepperWrap $size={size}>
      <StepperBtn
        type="button"
        $size={size}
        onClick={dec}
        disabled={num <= min}
        aria-label={`${ariaLabel || ''} 감소`}
      >
        −
      </StepperBtn>
      <StepperValue $size={size}>{num}</StepperValue>
      <StepperBtn
        type="button"
        $size={size}
        onClick={inc}
        disabled={num >= max}
        aria-label={`${ariaLabel || ''} 증가`}
      >
        +
      </StepperBtn>
    </StepperWrap>
  );
}

function nextUnfilledKey(filled, completed, form) {
  for (const key of FIELD_ORDER) {
    if (isLogicalFilled(key, filled)) continue;
    if (completed[key]) continue;
    // reservationDate가 기본값으로 채워져있어도 사용자가 한 번은 확인하도록 진행
    return key;
  }
  return null;
}

export default function ReservationForm({
  open,
  onClose,
  initial,
  defaultDate,
  defaultTime,
  onSubmit,
  onDelete,
  submitting,
}) {
  const isEdit = !!(initial && initial._id);
  const showToast = useToast();
  const speech = useSpeechRecognition({ lang: 'ko-KR', continuous: true, interimResults: true });

  const [form, setForm] = useState(emptyForm(defaultDate));
  const [filled, setFilled] = useState({});
  const [phase, setPhase] = useState('voice'); // 'voice' | 'fill'
  const [completed, setCompleted] = useState({}); // 사용자가 다음으로 넘긴 필드
  const [currentField, setCurrentField] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm(''));
      setFilled({});
      setCompleted({});
      setCurrentField(null);
      setPhase('voice');
      speech.reset();
      return;
    }
    if (initial && initial._id) {
      setForm({
        customerName: initial.customerName || '',
        phone: formatPhone(initial.phone || ''),
        reservationDate: toLocalYmd(initial.reservationDate),
        reservationTime: initial.reservationTime || '',
        adults: initial.adults || 0,
        children: initial.children || 0,
        items: Array.isArray(initial.items) ? initial.items.map((it) => ({ ...it })) : [],
        notes: initial.notes || '',
      });
      setPhase('fill'); // 수정 모드는 바로 폼 표시
    } else {
      const base = emptyForm(defaultDate);
      if (defaultTime) base.reservationTime = defaultTime;
      setForm(base);
      setPhase('voice'); // 새 예약은 마이크부터
    }
    setFilled({});
    setCompleted({});
    setCurrentField(null);
    speech.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaultDate, defaultTime]);

  // 모달 닫힐 때 마이크 자동 off
  useEffect(() => {
    if (!open) {
      speech.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleMicClick = () => {
    if (!speech.supported) {
      showToast('이 브라우저는 음성 인식을 지원하지 않습니다', 'error');
      return;
    }
    if (speech.listening) {
      speech.stop();
    } else {
      speech.start();
    }
  };

  useEffect(() => {
    // 듣기 종료 시 자동 파싱 + 폼 단계로 전환
    if (!open) return;
    if (speech.listening) return;
    if (!speech.transcript) return;
    const { fields, filled: filledMap } = parseReservationVoice(speech.transcript, {
      baseDate: new Date(),
    });
    setForm((prev) => ({
      ...prev,
      ...fields,
      items: fields.items || prev.items,
    }));
    setFilled((prev) => ({ ...prev, ...filledMap }));
    setCompleted({});
    setCurrentField(null);
    setPhase('fill');
  }, [speech.listening, speech.transcript, open]);

  // phase가 fill이고 currentField가 비어있으면 다음 미입력 필드 자동 선택
  useEffect(() => {
    if (!open) return;
    if (phase !== 'fill') return;
    if (currentField) return;
    if (isEdit) return; // 수정모드는 위저드 안 씀
    const next = nextUnfilledKey(filled, completed, form);
    if (next) setCurrentField(next);
  }, [open, phase, currentField, filled, completed, form, isEdit]);

  const chips = useMemo(() => {
    return FIELD_ORDER
      .filter((k) => (isLogicalFilled(k, filled) || completed[k]) && currentField !== k && hasFieldValue(k, form))
      .map((k) => ({ key: k, ...logicalChipLabel(k, form) }));
  }, [filled, completed, currentField, form]);

  const editChip = (key) => {
    setCurrentField(key);
  };

  const goNext = () => {
    if (!currentField) return;
    setCompleted((prev) => ({ ...prev, [currentField]: true }));
    const next = nextUnfilledKey(filled, { ...completed, [currentField]: true }, form);
    setCurrentField(next);
  };

  const handleFieldKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goNext();
    }
  };

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFilled((prev) => ({ ...prev, [key]: false }));
  };

  const updateItem = (idx, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const removeItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1 }],
    }));
  };

  const handleSubmit = () => {
    if (!form.reservationDate) {
      showToast('예약 날짜를 선택해주세요', 'error');
      return;
    }
    const cleaned = {
      ...form,
      phone: stripPhone(form.phone),
      adults: Number(form.adults) || 0,
      children: Number(form.children) || 0,
      items: form.items
        .filter((it) => (it.name || '').trim())
        .map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity) || 1,
        })),
    };
    onSubmit(cleaned);
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{isEdit ? '예약 수정' : '새 예약'}</Title>
          <CloseBtn onClick={onClose} aria-label="닫기">×</CloseBtn>
        </Header>

        <Body>
          {!speech.supported && (
            <UnsupportedNote>
              이 브라우저는 음성 인식을 지원하지 않아요. Chrome 또는 Safari에서 사용해주세요. (그래도 수동 입력은 가능합니다)
            </UnsupportedNote>
          )}

          {!isEdit && (
            <VoiceBox>
              <VoiceTop>
                <MicBtn
                  $listening={speech.listening}
                  disabled={!speech.supported}
                  onClick={handleMicClick}
                  aria-label={speech.listening ? '음성 입력 종료' : '음성 입력 시작'}
                >
                  {speech.listening ? '■' : '🎙'}
                </MicBtn>
                <VoiceInfo>
                  <VoiceLabel>
                    {speech.listening
                      ? '듣고 있어요…'
                      : phase === 'voice'
                      ? '음성으로 한 번에 입력'
                      : '다시 녹음하기'}
                  </VoiceLabel>
                  <VoiceHint>
                    예: "김영희 내일 오후 6시 장유 2개 010-1234-5678 어른 두 명 아이 한 명"
                  </VoiceHint>
                </VoiceInfo>
              </VoiceTop>

              {(speech.transcript || speech.interim) && (
                <TranscriptBox>
                  {speech.transcript}
                  {speech.interim && <Interim> {speech.interim}</Interim>}
                </TranscriptBox>
              )}

              {chips.length > 0 && (
                <ParsedPreview>
                  {chips.map((c) => (
                    <ParsedChip
                      key={c.key}
                      onClick={() => editChip(c.key)}
                      title="탭하여 수정"
                    >
                      {c.title}: {c.value} <ChipEdit>수정</ChipEdit>
                    </ParsedChip>
                  ))}
                </ParsedPreview>
              )}
            </VoiceBox>
          )}

          {!isEdit && phase === 'voice' && (
            <SkipRow>
              <SkipBtn onClick={() => setPhase('fill')}>직접 입력하기</SkipBtn>
            </SkipRow>
          )}

          {phase === 'fill' && isEdit && (
            <>
              <FieldGrid>
                <Field>
                  <Label>이름</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    placeholder="예약자 이름"
                  />
                </Field>
                <Field>
                  <Label>연락처</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                    placeholder="010-1234-5678"
                    inputMode="tel"
                  />
                </Field>
                <Field>
                  <Label>날짜</Label>
                  <Input
                    type="date"
                    value={form.reservationDate}
                    onChange={(e) => updateField('reservationDate', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>시간</Label>
                  <Input
                    type="time"
                    value={form.reservationTime}
                    onChange={(e) => updateField('reservationTime', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>인원</Label>
                  <PeopleRow>
                    <PeopleCol>
                      <PeopleLabel>성인</PeopleLabel>
                      <Stepper
                        value={form.adults}
                        onChange={(v) => updateField('adults', v)}
                        ariaLabel="성인"
                      />
                    </PeopleCol>
                    <PeopleCol>
                      <PeopleLabel>어린이</PeopleLabel>
                      <Stepper
                        value={form.children}
                        onChange={(v) => updateField('children', v)}
                        ariaLabel="어린이"
                      />
                    </PeopleCol>
                  </PeopleRow>
                </Field>
              </FieldGrid>

              <Section>
                <SectionTitle>메뉴</SectionTitle>
                {form.items.map((it, idx) => (
                  <ItemRow key={idx}>
                    <ItemInput
                      placeholder="메뉴명"
                      value={it.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                    />
                    <Stepper
                      size="sm"
                      min={1}
                      value={it.quantity}
                      onChange={(v) => updateItem(idx, { quantity: v })}
                      ariaLabel="수량"
                    />
                    <IconBtn onClick={() => removeItem(idx)} aria-label="삭제">×</IconBtn>
                  </ItemRow>
                ))}
                <AddItemBtn onClick={addItem}>+ 메뉴 추가</AddItemBtn>
              </Section>

              <Section>
                <SectionTitle>고객메모</SectionTitle>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="알레르기, 요청사항 등"
                />
              </Section>
            </>
          )}

          {phase === 'fill' && !isEdit && currentField && (() => {
            const willComplete = { ...completed, [currentField]: true };
            const isLastField = !nextUnfilledKey(filled, willComplete, form);
            const hasValue = hasFieldValue(currentField, form);
            const rightLabel = isLastField
              ? (submitting ? '저장 중…' : '저장')
              : (hasValue ? '다음 →' : '건너뛰기');
            const onRight = isLastField ? handleSubmit : goNext;
            return (
            <WizardCard key={currentField}>
              <WizardLabel>다음 항목</WizardLabel>
              <WizardTitle>{fieldTitle(currentField)}</WizardTitle>
              <WizardBody>
                {currentField === 'customerName' && (
                  <Input
                    autoFocus
                    value={form.customerName}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    onKeyDown={handleFieldKeyDown}
                    placeholder="예약자 이름"
                  />
                )}
                {currentField === 'phone' && (
                  <Input
                    autoFocus
                    value={form.phone}
                    onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                    onKeyDown={handleFieldKeyDown}
                    placeholder="010-1234-5678"
                    inputMode="tel"
                  />
                )}
                {currentField === 'reservationDate' && (
                  <Input
                    autoFocus
                    type="date"
                    value={form.reservationDate}
                    onChange={(e) => updateField('reservationDate', e.target.value)}
                    onKeyDown={handleFieldKeyDown}
                  />
                )}
                {currentField === 'reservationTime' && (
                  <Input
                    autoFocus
                    type="time"
                    value={form.reservationTime}
                    onChange={(e) => updateField('reservationTime', e.target.value)}
                    onKeyDown={handleFieldKeyDown}
                  />
                )}
                {currentField === 'people' && (
                  <PeopleRow>
                    <PeopleCol>
                      <PeopleLabel>성인</PeopleLabel>
                      <Stepper
                        value={form.adults}
                        onChange={(v) => updateField('adults', v)}
                        ariaLabel="성인"
                      />
                    </PeopleCol>
                    <PeopleCol>
                      <PeopleLabel>어린이</PeopleLabel>
                      <Stepper
                        value={form.children}
                        onChange={(v) => updateField('children', v)}
                        ariaLabel="어린이"
                      />
                    </PeopleCol>
                  </PeopleRow>
                )}
                {currentField === 'items' && (
                  <>
                    {form.items.map((it, idx) => (
                      <ItemRow key={idx}>
                        <ItemInput
                          autoFocus={idx === 0}
                          placeholder="메뉴명"
                          value={it.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value })}
                        />
                        <Stepper
                          size="sm"
                          min={1}
                          value={it.quantity}
                          onChange={(v) => updateItem(idx, { quantity: v })}
                          ariaLabel="수량"
                        />
                        <IconBtn onClick={() => removeItem(idx)} aria-label="삭제">×</IconBtn>
                      </ItemRow>
                    ))}
                    <AddItemBtn onClick={addItem}>+ 메뉴 추가</AddItemBtn>
                  </>
                )}
                {currentField === 'notes' && (
                  <Textarea
                    autoFocus
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="고객메모를 입력해주세요."
                  />
                )}
              </WizardBody>
              <WizardActions>
                <ActionBtn type="button" $variant="secondary" onClick={onClose} disabled={submitting}>
                  취소
                </ActionBtn>
                <ActionBtn
                  type="button"
                  $variant={isLastField ? 'save' : 'primary'}
                  onClick={onRight}
                  disabled={submitting}
                >
                  {rightLabel}
                </ActionBtn>
              </WizardActions>
            </WizardCard>
            );
          })()}

          {phase === 'fill' && !isEdit && !currentField && (
            <>
              <DoneNote>✓ 입력 완료</DoneNote>
              <BottomActions>
                <ActionBtn type="button" $variant="secondary" onClick={onClose} disabled={submitting}>
                  취소
                </ActionBtn>
                <ActionBtn type="button" $variant="save" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '저장 중…' : '저장'}
                </ActionBtn>
              </BottomActions>
            </>
          )}

          {phase === 'fill' && isEdit && (
            <BottomActions>
              {onDelete ? (
                <ActionBtn type="button" $variant="danger" onClick={onDelete} disabled={submitting}>
                  삭제
                </ActionBtn>
              ) : (
                <ActionBtn type="button" $variant="secondary" onClick={onClose} disabled={submitting}>
                  취소
                </ActionBtn>
              )}
              <ActionBtn type="button" $variant="save" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '저장 중…' : '저장'}
              </ActionBtn>
            </BottomActions>
          )}
        </Body>
      </Modal>
    </Overlay>
  );
}
