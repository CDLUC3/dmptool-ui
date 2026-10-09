export function GET() {
  return new Response('<!doctype html><html><body>OK</body></html>', {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}
