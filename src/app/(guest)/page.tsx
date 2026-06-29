import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <PageHeader subtitle="StayMate" title="Sujin's Home Stay" />

      {/* 숙소 이미지 */}
      <div className="mx-5 mb-6 h-52 overflow-hidden rounded-2xl bg-slate-100 relative">
        <Image
          src="/hero.jpg"
          alt="고덕 온빛채 아파트 전경"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="px-5">
        <div className="mb-6 space-y-4">
          <div>
            <h2 className="mb-1 text-lg font-bold text-slate-900">숙소 소개</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              여유로운 시간을 보낼 수 있는 아늑한 공간, Sujin&apos;s Home Stay입니다.{" "}
              <br />
              원하시는 날짜의 숙박 일자를 예약해주세요.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-slate-900">편의 시설</h2>
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-slate-900">이용 안내</h2>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex gap-2">
                <span className="mt-0.5 text-slate-900">•</span>
                최대 3인까지 이용 가능합니다
              </li>
              <li className="flex flex-col gap-1">
                <span className="flex gap-2">
                  <span className="mt-0.5 text-slate-900">•</span>
                  예약 확정 후 관리자가 카카오톡으로 입출차 가능 번호를 안내드립니다
                </span>
                <span className="ml-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-relaxed">
                  ⚠️ 주차 후 반드시 관리사무소에서 주차용 딱지를 발급받아 차량 내에 비치해 주세요. 미부착 시 주차 딱지가 부착될 수 있습니다.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-slate-900">•</span>
                예약 신청 후 관리자 승인을 통해 확정됩니다
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-slate-900">•</span>
                반려동물 동반 가능합니다
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-slate-900">•</span>
                단지 내 게스트하우스 이용 가능합니다 (소파·냉장고 구비)
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-4">
          <Button asChild fullWidth size="lg">
            <Link href="/book">예약하기</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

const amenities = [
  { icon: "🛁", label: "욕실" },
  { icon: "🍳", label: "주방" },
  { icon: "📶", label: "와이파이" },
  { icon: "🅿️", label: "주차 가능" },
  { icon: "❄️", label: "에어컨" },
  { icon: "🔥", label: "난방" },
];
