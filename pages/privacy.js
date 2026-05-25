import styled from "styled-components";

export default function PrivacyPage() {
  return (
    <Container>
      <Content>
        <h1>개인정보처리방침</h1>
        <p className="updated">시행일: 2026년 5월 25일</p>

        <Section>
          <h2>1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            장유해신탕(이하 &quot;회사&quot;)은 매장 운영 및 주문 관리를 위해
            다음과 같은 목적으로 개인정보를 수집·이용합니다.
          </p>
          <ul>
            <li>관리자 계정 인증 및 서비스 이용</li>
            <li>주문 접수, 처리 및 내역 관리</li>
            <li>푸시 알림 발송 (신규 주문, 직원 호출 등)</li>
          </ul>
        </Section>

        <Section>
          <h2>2. 수집하는 개인정보 항목</h2>
          <ul>
            <li>관리자 계정 정보: 이메일, 비밀번호(암호화 저장), 이름</li>
            <li>기기 정보: 푸시 알림용 기기 토큰(FCM)</li>
            <li>주문 정보: 테이블 번호, 주문 내역, 주문 시간</li>
          </ul>
        </Section>

        <Section>
          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체
            없이 파기합니다. 다만, 관련 법령에 의해 보존이 필요한 경우 해당
            기간 동안 보관합니다.
          </p>
          <ul>
            <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
            <li>접속 기록: 3개월 (통신비밀보호법)</li>
          </ul>
        </Section>

        <Section>
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 법령에 의해 요구되는 경우에는 예외로 합니다.
          </p>
        </Section>

        <Section>
          <h2>5. 개인정보의 파기 절차 및 방법</h2>
          <p>
            전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며,
            종이에 출력된 정보는 분쇄하거나 소각하여 파기합니다.
          </p>
        </Section>

        <Section>
          <h2>6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할
            수 있으며, 회사는 이에 대해 지체 없이 조치합니다.
          </p>
        </Section>

        <Section>
          <h2>7. 개인정보 보호책임자</h2>
          <ul>
            <li>상호: 장유해신탕</li>
            <li>이메일: dan0748@dowhat.io</li>
          </ul>
        </Section>

        <Section>
          <h2>8. 개인정보처리방침의 변경</h2>
          <p>
            본 개인정보처리방침은 법령 및 방침에 따라 변경될 수 있으며, 변경
            시 앱 내 공지를 통해 안내합니다.
          </p>
        </Section>
      </Content>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
`;

const Content = styled.div`
  max-width: 720px;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1b1d1f;
    margin: 0 0 8px;
  }

  .updated {
    color: #8b95a1;
    font-size: 14px;
    margin: 0 0 32px;
  }
`;

const Section = styled.section`
  margin-bottom: 28px;

  h2 {
    font-size: 17px;
    font-weight: 600;
    color: #1b1d1f;
    margin: 0 0 10px;
  }

  p {
    font-size: 15px;
    color: #4e5968;
    line-height: 1.7;
    margin: 0 0 8px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
  }

  li {
    font-size: 15px;
    color: #4e5968;
    line-height: 1.8;
  }
`;
