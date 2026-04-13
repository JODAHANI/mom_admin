import styled from 'styled-components';

const sizes = {
  sm: { trackW: 36, trackH: 20, thumb: 16 },
  md: { trackW: 44, trackH: 24, thumb: 20 },
};

const Track = styled.div`
  width: ${(p) => sizes[p.$size].trackW}px;
  height: ${(p) => sizes[p.$size].trackH}px;
  border-radius: 12px;
  background: ${(p) => (p.$checked ? (p.$color || '#3182F6') : '#E5E8EB')};
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
`;

const Thumb = styled.div`
  width: ${(p) => sizes[p.$size].thumb}px;
  height: ${(p) => sizes[p.$size].thumb}px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: ${(p) =>
    p.$checked
      ? sizes[p.$size].trackW - sizes[p.$size].thumb - 2
      : 2}px;
  transition: left 0.2s ease;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Label = styled.span`
  font-size: 11px;
  color: #8b95a1;
  white-space: nowrap;
`;

export default function Toggle({
  checked = false,
  onChange,
  label,
  size = 'md',
  color,
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    onChange?.(!checked);
  };

  return (
    <Wrapper>
      {label && <Label>{label}</Label>}
      <Track $checked={checked} $size={size} $color={color} onClick={handleClick}>
        <Thumb $checked={checked} $size={size} />
      </Track>
    </Wrapper>
  );
}
