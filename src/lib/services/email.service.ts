import nodemailer from "nodemailer";

import { getServerEnv } from "@/lib/env";
import type { SerializedReservation } from "@/lib/services/reservation.service";

let transporter: nodemailer.Transporter | null = null;

// Nodemailer Transporter 초기화 함수
function getTransporter() {
  if (transporter) return transporter;

  const env = getServerEnv();

  if (env.SMTP_HOST && env.SMTP_PORT) {
    // 실제 SMTP 서버 연결 설정
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // 465 포트인 경우 SSL 적용
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    });
  } else {
    // 환경변수 미등록 시 콘솔에 출력을 수행하는 JSON transporter 사용 (개발용)
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

// 이메일 발송 기본 옵션 획득
function getMailOptions(to: string, subject: string, html: string) {
  const env = getServerEnv();
  const from = env.MAIL_FROM || "StayMate <no-reply@staymate.com>";
  return {
    from,
    to,
    subject,
    html,
  };
}

// 공통 날짜 포맷팅 유틸리티
function formatDateString(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// 공통 HTML 이메일 템플릿 래퍼
function wrapHtmlTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>StayMate</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #e4e4e7;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }
        .header {
          margin-bottom: 24px;
        }
        .brand {
          font-size: 14px;
          font-weight: 700;
          color: #6366f1;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 8px;
          margin-bottom: 0;
          line-height: 1.3;
        }
        .divider {
          height: 1px;
          background-color: #e4e4e7;
          margin: 24px 0;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .details-label {
          font-size: 14px;
          color: #71717a;
          padding: 8px 0;
          width: 100px;
          vertical-align: top;
        }
        .details-value {
          font-size: 14px;
          font-weight: 500;
          color: #18181b;
          padding: 8px 0;
          vertical-align: top;
        }
        .button-group {
          margin-top: 32px;
          display: flex;
          gap: 12px;
        }
        .btn {
          display: inline-block;
          text-align: center;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .btn-primary {
          background-color: #6366f1;
          color: #ffffff !important;
        }
        .btn-outline {
          background-color: #ffffff;
          border: 1px solid #d4d4d8;
          color: #18181b !important;
        }
        .note-box {
          background-color: #fafafa;
          border-left: 4px solid #e4e4e7;
          padding: 16px;
          border-radius: 4px;
          margin-top: 16px;
          font-size: 14px;
          color: #52525b;
          line-height: 1.5;
        }
        .footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #a1a1aa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          ${content}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} StayMate. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. 관리자용: 새로운 예약 접수 알림 메일 발송
export async function sendAdminNotification(
  reservation: SerializedReservation,
  token: string,
) {
  const env = getServerEnv();
  const baseUrl = env.AUTH_URL || "http://localhost:3000";
  const adminEmails = env.ADMIN_EMAILS;

  if (adminEmails.length === 0) {
    console.warn("[EmailService] ADMIN_EMAILS가 설정되어 있지 않습니다.");
    return;
  }

  const approveUrl = `${baseUrl}/api/reservations/${reservation.id}/approve?token=${token}`;
  const rejectUrl = `${baseUrl}/api/reservations/${reservation.id}/reject?token=${token}`;

  const htmlContent = wrapHtmlTemplate(`
    <div class="header">
      <div class="brand">StayMate Admin</div>
      <h2 class="title">새로운 예약 신청이 접수되었습니다</h2>
    </div>
    <div class="divider"></div>
    <table class="details-table">
      <tr>
        <td class="details-label">신청자</td>
        <td class="details-value">${reservation.guestName} (${reservation.guestEmail})</td>
      </tr>
      <tr>
        <td class="details-label">인원</td>
        <td class="details-value">${reservation.guestCount}명</td>
      </tr>
      <tr>
        <td class="details-label">체크인</td>
        <td class="details-value">${formatDateString(reservation.checkIn)}</td>
      </tr>
      <tr>
        <td class="details-label">체크아웃</td>
        <td class="details-value">${formatDateString(reservation.checkOut)}</td>
      </tr>
      ${
        reservation.memo
          ? `
      <tr>
        <td class="details-label">요청사항</td>
        <td class="details-value">${reservation.memo}</td>
      </tr>
      `
          : ""
      }
    </table>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin-bottom: 24px;">
      아래 버튼을 눌러 예약을 즉시 승인하거나 거절할 수 있습니다. (로그인이 필요하지 않으며, 이 링크는 24시간 동안 유효합니다.)
    </p>
    <div class="button-group">
      <a href="${approveUrl}" class="btn btn-primary" style="margin-right: 8px;">예약 승인하기</a>
      <a href="${rejectUrl}" class="btn btn-outline">예약 거절하기</a>
    </div>
  `);

  const client = getTransporter();

  // 모든 관리자 메일주소로 메일 발송
  for (const email of adminEmails) {
    try {
      const info = await client.sendMail(
        getMailOptions(
          email,
          `[StayMate Admin] ${reservation.guestName}님의 예약 신청이 접수되었습니다.`,
          htmlContent,
        ),
      );
      // Ethereal 또는 jsonTransport 사용 시 로그 출력
      if ("message" in info) {
        console.log(
          `[EmailService] Admin 알림 이메일 로깅 (수신자: ${email}):`,
          (info as Record<string, unknown>).message,
        );
      } else {
        console.log(`[EmailService] Admin 알림 이메일 발송 성공: ${email}`);
      }
    } catch (error) {
      console.error(
        `[EmailService] Admin 알림 이메일 발송 실패 (${email}):`,
        error,
      );
    }
  }
}

// 2. 게스트용: 예약 확정 알림 메일 발송
export async function sendGuestConfirmation(
  reservation: SerializedReservation,
) {
  const env = getServerEnv();
  const propertyAddress = env.PROPERTY_ADDRESS;

  const htmlContent = wrapHtmlTemplate(`
    <div class="header">
      <div class="brand">StayMate</div>
      <h2 class="title">예약이 확정되었습니다! 🎉</h2>
    </div>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
      안녕하세요, ${reservation.guestName}님.<br>
      신청하신 일정의 예약이 완료되었습니다. 숙소에서 만나 뵙기를 기대하겠습니다!
    </p>
    <div class="divider"></div>
    <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">예약 확정 정보</h3>
    <table class="details-table" style="margin-bottom: 0;">
      <tr>
        <td class="details-label">예약자명</td>
        <td class="details-value">${reservation.guestName}</td>
      </tr>
      <tr>
        <td class="details-label">인원</td>
        <td class="details-value">${reservation.guestCount}명</td>
      </tr>
      <tr>
        <td class="details-label">체크인</td>
        <td class="details-value">${formatDateString(reservation.checkIn)}</td>
      </tr>
      <tr>
        <td class="details-label">체크아웃</td>
        <td class="details-value">${formatDateString(reservation.checkOut)}</td>
      </tr>
      ${propertyAddress ? `
      <tr>
        <td class="details-label">숙소 주소</td>
        <td class="details-value" style="color: #6366f1; font-weight: 600;">${propertyAddress}</td>
      </tr>
      ` : ""}
    </table>
    ${propertyAddress ? `
    <div class="note-box" style="margin-top: 24px; border-left-color: #6366f1; background-color: #f5f3ff;">
      <p style="margin: 0; font-size: 13px; color: #4338ca; font-weight: 500;">
        📍 위 주소로 체크인 날짜에 방문해 주세요.<br>
        문의사항이 있으시면 예약 이메일로 연락해 주세요.
      </p>
    </div>
    ` : ""}
  `);

  const client = getTransporter();

  try {
    const info = await client.sendMail(
      getMailOptions(
        reservation.guestEmail,
        `[StayMate] 신청하신 예약이 확정되었습니다.`,
        htmlContent,
      ),
    );
    if ("message" in info) {
      console.log(
        `[EmailService] Guest 확정 이메일 로깅 (수신자: ${reservation.guestEmail}):`,
        (info as Record<string, unknown>).message,
      );
    } else {
      console.log(
        `[EmailService] Guest 확정 이메일 발송 성공: ${reservation.guestEmail}`,
      );
    }
  } catch (error) {
    console.error(
      `[EmailService] Guest 확정 이메일 발송 실패 (${reservation.guestEmail}):`,
      error,
    );
  }
}

// 3. 게스트용: 예약 거절 알림 메일 발송
export async function sendGuestRejection(
  reservation: SerializedReservation,
  adminNote?: string,
) {
  const htmlContent = wrapHtmlTemplate(`
    <div class="header">
      <div class="brand">StayMate</div>
      <h2 class="title" style="color: #ef4444;">예약 신청이 거절되었습니다</h2>
    </div>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
      안녕하세요, ${reservation.guestName}님.<br>
      대단히 죄송하게도 신청하신 일정의 예약이 거절되어 안내 메일을 드립니다.
    </p>
    
    <table class="details-table" style="margin-top: 16px; margin-bottom: 16px;">
      <tr>
        <td class="details-label">신청 일정</td>
        <td class="details-value">${formatDateString(reservation.checkIn)} ~ ${formatDateString(reservation.checkOut)}</td>
      </tr>
    </table>

    ${
      adminNote
        ? `
      <h4 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">거절 사유</h4>
      <div class="note-box">
        ${adminNote}
      </div>
      `
        : ""
    }
    
    <p style="font-size: 13px; color: #71717a; margin-top: 24px; line-height: 1.5;">
      해당 날짜는 다시 예약이 가능하도록 활성화되었습니다. 다른 일정으로 예약을 진행해 주시면 감사하겠습니다.
    </p>
  `);

  const client = getTransporter();

  try {
    const info = await client.sendMail(
      getMailOptions(
        reservation.guestEmail,
        `[StayMate] 예약 신청이 취소/거절되었습니다.`,
        htmlContent,
      ),
    );
    if ("message" in info) {
      console.log(
        `[EmailService] Guest 거절 이메일 로깅 (수신자: ${reservation.guestEmail}):`,
        (info as Record<string, unknown>).message,
      );
    } else {
      console.log(
        `[EmailService] Guest 거절 이메일 발송 성공: ${reservation.guestEmail}`,
      );
    }
  } catch (error) {
    console.error(
      `[EmailService] Guest 거절 이메일 발송 실패 (${reservation.guestEmail}):`,
      error,
    );
  }
}
