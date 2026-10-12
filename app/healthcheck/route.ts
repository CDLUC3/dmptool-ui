export function GET() {

  console.log("--- HEALTH CHECK HIT ---");

  return new Response('OK', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
