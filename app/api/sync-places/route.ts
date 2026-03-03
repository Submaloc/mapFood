import { NextResponse } from "next/server";
import { syncPlacesFromOverpass } from "@/app/services/place.service";

export async function POST() {
  try {
    const { created, updated, skipped } = await syncPlacesFromOverpass();

    return NextResponse.json({
      ok: true,
      created,
      updated,
      skipped,
      message: `Синхронизация завершена: создано ${created}, обновлено ${updated}, пропущено дубликатов ${skipped}.`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[sync-places] Error:", e);
    return NextResponse.json(
      { error: "Sync failed", details: message },
      { status: 500 }
    );
  }
}


