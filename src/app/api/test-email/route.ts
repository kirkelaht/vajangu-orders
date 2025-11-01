import { sendOrderEmail } from "@/lib/sendOrderEmail";

export async function GET() {
  const result = await sendOrderEmail("vajanguperefarm@gmail.com", "0001");
  return Response.json({ status: "ok", emailResult: result });
}

