import { addMonths } from "date-fns";

import { getBlockedRanges } from "@/lib/services/availability.service";
import { BookClient } from "./book-client";

export default async function BookPage() {
  const from = new Date();
  const to = addMonths(from, 3);

  const blockedRanges = await getBlockedRanges(from, to).catch(() => []);

  return <BookClient blockedRanges={blockedRanges} />;
}
