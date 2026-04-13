import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6f8;
`;

const Card = styled.div`
  max-width: 400px;
  width: 100%;
  background: white;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  margin: 0 16px;

  @media (max-width: 480px) {
    padding: 32px 20px;
    border-radius: 12px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 32px;
  color: #1b1d1f;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  color: #8b95a1;
  margin-bottom: 4px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3182f6;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #3182f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    background: #1b6ce5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RememberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3182f6;
`;

const RememberLabel = styled.label`
  font-size: 14px;
  color: #8b95a1;
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  color: #ff3b30;
  font-size: 14px;
  text-align: center;
  margin-top: 12px;
`;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth({ redirectIfUnauthenticated: false });
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedEmail');
    if (saved) {
      setEmail(saved);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (rememberEmail) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      await login(email, password);
      showToast('로그인 되었습니다', 'auth', { position: 'center-bottom' });
      router.push('/products');
    } catch (err) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Card>
        <Title>테이블 홈 관리자</Title>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label>아이디</Label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
            />
          </FieldGroup>
          <FieldGroup>
            <Label>비밀번호</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </FieldGroup>
          <RememberRow>
            <Checkbox
              type="checkbox"
              id="remember"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
            />
            <RememberLabel htmlFor="remember">아이디 기억하기</RememberLabel>
          </RememberRow>
          <LoginButton type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </LoginButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
      </Card>
    </PageWrapper>
  );
}
