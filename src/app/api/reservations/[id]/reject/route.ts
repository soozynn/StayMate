import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getServerEnv } from "@/lib/env";
import {
  getReservationServiceStatus,
  updateStatus,
  ReservationServiceError,
} from "@/lib/services/reservation.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token") || "";
  const env = getServerEnv();
  const baseUrl = env.AUTH_URL || "http://localhost:3000";

  try {
    // 공통 서비스인 updateStatus를 호출하여 토큰 검증 및 예약 거절 처리 (날짜 재활성화)
    revalidatePath("/calendar");
    revalidatePath("/book");
    const reservation = await updateStatus(id, "rejected", {
      source: "email",
      token,
      reviewedBy: "system-email-action",
      adminNote: "이메일 원클릭 처리에 의해 예약이 거절되었습니다.",
    });

    const checkInStr = new Date(reservation.checkIn).toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      },
    );
    const checkOutStr = new Date(reservation.checkOut).toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      },
    );

    // 프리미엄 디자인이 적용된 거절 완료 HTML 페이지 반환
    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>예약 거절 완료 | StayMate</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            color: #18181b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e4e4e7;
            border-radius: 20px;
            padding: 40px 32px;
            max-width: 440px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          }
          .icon-container {
            width: 64px;
            height: 64px;
            background-color: #fef3c7;
            color: #d97706;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .icon {
            width: 32px;
            height: 32px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 12px;
            color: #0f172a;
          }
          p.description {
            font-size: 14px;
            color: #71717a;
            margin: 0 0 32px;
            line-height: 1.5;
          }
          .details-box {
            background-color: #fafafa;
            border: 1px solid #f4f4f5;
            border-radius: 12px;
            padding: 20px;
            text-align: left;
            margin-bottom: 32px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .details-row:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #71717a;
          }
          .value {
            font-weight: 600;
            color: #18181b;
          }
          .btn {
            display: block;
            background-color: #0f172a;
            color: #ffffff;
            text-decoration: none;
            padding: 14px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #18181b;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-container">
            <svg class="icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
          </div>
          <h1>예약 거절 완료</h1>
          <p class="description">해당 예약 신청이 성공적으로 거절되었습니다.<br>날짜가 재활성화되었으며 게스트에게 알림 메일이 전송되었습니다.</p>
          
          <div class="details-box">
            <div class="details-row">
              <span class="label">예약자</span>
              <span class="value">${reservation.guestName}</span>
            </div>
            <div class="details-row">
              <span class="label">인원</span>
              <span class="value">${reservation.guestCount}명</span>
            </div>
            <div class="details-row">
              <span class="label">일정</span>
              <span class="value" style="font-size: 13px;">${checkInStr} - ${checkOutStr}</span>
            </div>
          </div>
          
          <a href="${baseUrl}" class="btn">메인 페이지로 이동</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    let status = 500;
    let title = "예약 처리 실패";
    let message = "예약을 거절하는 도중 오류가 발생했습니다.";

    if (error instanceof ReservationServiceError) {
      status = getReservationServiceStatus(error) || 500;
      if (error.code === "TOKEN_INVALID" || error.code === "TOKEN_REQUIRED") {
        title = "유효하지 않은 링크";
        message =
          "만료되었거나 이미 사용된 승인 토큰입니다. 올바른 경로인지 다시 확인해 주세요.";
      } else if (error.code === "ALREADY_REVIEWED") {
        title = "처리 완료된 예약";
        message = "이미 승인 혹은 거절 처리가 완료된 예약입니다.";
      } else if (error.code === "NOT_FOUND") {
        title = "예약 정보 없음";
        message = "일치하는 예약 정보를 데이터베이스에서 찾을 수 없습니다.";
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | StayMate</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            color: #18181b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e4e4e7;
            border-radius: 20px;
            padding: 40px 32px;
            max-width: 440px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          }
          .icon-container {
            width: 64px;
            height: 64px;
            background-color: #fef2f2;
            color: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .icon {
            width: 32px;
            height: 32px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 12px;
            color: #0f172a;
          }
          p.description {
            font-size: 14px;
            color: #71717a;
            margin: 0 0 32px;
            line-height: 1.6;
          }
          .btn {
            display: block;
            background-color: #0f172a;
            color: #ffffff;
            text-decoration: none;
            padding: 14px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #18181b;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-container">
            <svg class="icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1>${title}</h1>
          <p class="description">${message}</p>
          <a href="${baseUrl}" class="btn">메인 페이지로 이동</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
