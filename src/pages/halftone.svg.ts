import { halftoneSvg } from '../lib/halftone';

export const GET = () => new Response(halftoneSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
