import { NextResponse } from 'next/server';
import { seed } from '@/lib/seed';
import { requireAdmin } from '@/lib/authGuard';

/**
 * Wipes and re-seeds categories, products and hero slides.
 * Destructive, so it is admin-only and disabled in production builds.
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await seed();
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}
