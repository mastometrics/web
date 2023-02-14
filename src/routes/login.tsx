import { redirect } from "solid-start";

export function GET() {
  return redirect("/auth/login");
}
