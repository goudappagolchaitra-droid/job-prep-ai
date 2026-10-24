
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to save your plan." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 150)
        : "AI Study Plan";

    const plan = body.plan;
    const hours = Number(body.hours);
    const days = Number(body.days);

    if (
      typeof plan !== "string" ||
      !plan.trim() ||
      plan.length > 50000 ||
      !Number.isInteger(hours) ||
      hours < 1 ||
      hours > 12 ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30
    ) {
      return NextResponse.json(
        { error: "Please provide a valid study plan, hours, and duration." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_study_plans")
      .insert({
        user_id: user.id,
        title,
        plan_content: plan,
        daily_hours: hours,
        duration_days: days,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Saving study plan failed:", error);
      return NextResponse.json(
        { error: "Could not save your plan. Check the Supabase table and policies." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Save study plan error:", error);
    return NextResponse.json(
      { error: "Unable to save your study plan right now." },
      { status: 500 }
    );
  }
}
