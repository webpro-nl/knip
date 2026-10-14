export function GET() {
  return new Response('User-agent: *');
}

export function POST() {
  return new Response(null, { status: 405 });
}
