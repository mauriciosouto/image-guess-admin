import { NextResponse } from "next/server";

import { dataSources } from "@/lib/datasources";

export async function GET() {
  try {
    const dataSourcesPayload = await Promise.all(
      dataSources.map(async ({ id, name, describeLoadFilters }) => {
        const loadFilters = describeLoadFilters
          ? await describeLoadFilters()
          : [];
        return {
          id,
          name,
          loadFilters,
        };
      })
    );

    return NextResponse.json({ dataSources: dataSourcesPayload });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
