export async function POST() {
  return Response.json(
    {
      ok: false,
      error: 'Server proxy disabled. Use direct gateway mode from the browser.'
    },
    { status: 410 }
  );
}
