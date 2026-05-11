import { useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const QuickGroup = styled.div`
  display: inline-flex;
  background: #F5F6F8;
  padding: 3px;
  border-radius: 10px;
  gap: 2px;
`;

const QuickBtn = styled.button`
  padding: 7px 14px;
  border: none;
  background: ${(p) => (p.$active ? 'white' : 'transparent')};
  color: ${(p) => (p.$active ? '#3182F6' : '#6b7684')};
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? '700' : '500')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: ${(p) => (p.$active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none')};

  &:hover {
    color: ${(p) => (p.$active ? '#3182F6' : '#191f28')};
  }
`;

const DateRange = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const DateInput = styled.input`
  padding: 7px 10px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 13px;
  color: #191f28;
  outline: none;

  &:focus {
    border-color: #3182F6;
  }
`;

const Tilde = styled.span`
  color: #8b95a1;
  font-size: 13px;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8b95a1;
  font-size: 14px;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 34px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;

  &:focus { border-color: #3182F6; }
`;

const Spacer = styled.div`
  flex: 1;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const FilterToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#e5e8eb')};
  background: ${(p) => (p.$active ? '#EAF2FE' : 'white')};
  color: ${(p) => (p.$active ? '#3182F6' : '#4e5968')};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3182F6;
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #3182F6;
  color: white;
  font-size: 11px;
  font-weight: 700;
`;

const Caret = styled.span`
  font-size: 10px;
  color: inherit;
`;

const ResetBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  border: 1px solid #e5e8eb;
  background: white;
  color: #6b7684;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #F44336;
    border-color: #FFCDD2;
  }
`;

const Total = styled.div`
  font-size: 13px;
  color: #8b95a1;
  white-space: nowrap;

  strong {
    color: #191f28;
    font-weight: 700;
  }
`;

const DetailSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ECEEF1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RowEl = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const RowLabel = styled.div`
  width: 60px;
  flex-shrink: 0;
  font-size: 13px;
  color: #8b95a1;
  font-weight: 600;
`;

const RowContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
`;

const Segmented = styled.div`
  display: inline-flex;
  background: #F5F6F8;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
`;

const SegBtn = styled.button`
  padding: 6px 14px;
  border: none;
  background: ${(p) => (p.$active ? 'white' : 'transparent')};
  color: ${(p) => (p.$active ? '#3182F6' : '#6b7684')};
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? '700' : '500')};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: ${(p) => (p.$active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none')};

  &:hover {
    color: ${(p) => (p.$active ? '#3182F6' : '#191f28')};
  }
`;

const Select = styled.select`
  padding: 7px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 13px;
  color: #191f28;
  background: white;
  outline: none;

  &:focus { border-color: #3182F6; }
`;

export function SegmentedControl({ options, value, onChange }) {
  return (
    <Segmented>
      {options.map((opt) => (
        <SegBtn
          key={String(opt.value)}
          $active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </SegBtn>
      ))}
    </Segmented>
  );
}

export function FilterRow({ label, children }) {
  return (
    <RowEl>
      <RowLabel>{label}</RowLabel>
      <RowContent>{children}</RowContent>
    </RowEl>
  );
}

export function FilterSelect(props) {
  return <Select {...props} />;
}

export default function FilterBar({
  startDate,
  endDate,
  quickRange,
  onDateChange,
  onQuickRange,
  searchValue,
  searchPlaceholder = '검색',
  onSearchChange,
  detailFilters,
  detailCount = 0,
  totalText,
  onReset,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Wrapper>
      <TopRow>
        <QuickGroup>
          <QuickBtn $active={quickRange === 'today'} onClick={() => onQuickRange('today')}>오늘</QuickBtn>
          <QuickBtn $active={quickRange === 'yesterday'} onClick={() => onQuickRange('yesterday')}>어제</QuickBtn>
          <QuickBtn $active={quickRange === 'week'} onClick={() => onQuickRange('week')}>이번주</QuickBtn>
          <QuickBtn $active={quickRange === 'month'} onClick={() => onQuickRange('month')}>이번달</QuickBtn>
        </QuickGroup>
        <DateRange>
          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => onDateChange('start', e.target.value)}
          />
          <Tilde>~</Tilde>
          <DateInput
            type="date"
            value={endDate}
            onChange={(e) => onDateChange('end', e.target.value)}
          />
        </DateRange>
      </TopRow>

      <BottomRow>
        {onSearchChange ? (
          <SearchWrap>
            <SearchIcon>🔍</SearchIcon>
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </SearchWrap>
        ) : (
          <Spacer />
        )}
        <Actions>
          {detailFilters && (
            <FilterToggle
              $active={detailCount > 0}
              onClick={() => setExpanded((x) => !x)}
            >
              <span>필터</span>
              {detailCount > 0 && <Badge>{detailCount}</Badge>}
              <Caret>{expanded ? '▴' : '▾'}</Caret>
            </FilterToggle>
          )}
          {onReset && (
            <ResetBtn onClick={onReset} title="필터 초기화">
              ⟲ 초기화
            </ResetBtn>
          )}
          {totalText && <Total>{totalText}</Total>}
        </Actions>
      </BottomRow>

      {expanded && detailFilters && (
        <DetailSection>{detailFilters}</DetailSection>
      )}
    </Wrapper>
  );
}
