export async function GET() {
  console.log("ENV:", process.env.MONGODB_URI)
  return Response.json({ ok: true })
}