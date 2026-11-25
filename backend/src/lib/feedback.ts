import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export const FEEDBACK_WINDOW_DAYS = 14;
const DAY = 86_400_000;

export interface RatingSummary {
  average: number;
  count:  number;
} 

export interface ReviewItem {
  rating: number;
  comment: string |  null;
  createdAt: Date;
  from: string;
  title: string;
}

export function windowEnd(completedAt: Date): Date {
    return new Date(completedAt.getTime() + FEEDBACK_WINDOW_DAYS * DAY);
}

export function isWindowOpen(completedAt: Date | null, now = Date.now()): boolean {
    return completedAt !== null && now < windowEnd(completedAt).getTime();
}

// Feedback is visible once both parties have submitted, or once the window has ended
export function isVisible(completedAt: Date | null, bothSubmitted: boolean, now = Date.now()): boolean {
    return bothSubmitted || (completedAt !== null && now >= windowEnd(completedAt).getTime());
}

const  projectSelect = {
  completedAt: true,
  application: {
    select: {
      talentProfileId: true,
      talentProfile: { select: { userId: true, fullName: true}},
      opportunity: {
        select: {
          businessProfileId: true,
          title: true,
          business: { select: { userId: true, organisationName: true } },
        },
      },
    },
  },
  feedback: { select: { authorUserId: true, rating: true, comment: true, createdAt: true } },
} satisfies Prisma.ProjectSelect;

type Item = ReviewItem & { key: string };

// about  = who the feedback is about: a  TALENT (written  by  the business) or a BUSINESS (written by a talent)
async function visibleItems(where: Prisma.ProjectWhereInput, about: 'TALENT' | 'BUSINESS'): Promise<Item[]> {
  const projects = await prisma.project.findMany({
    where: { status: 'COMPLETED', ...where },
    select: projectSelect,
    take: 500,
  });

  const out:  Item[] =  [];
  for (const p of projects) {
    const talentUserId =  p.application.talentProfile.userId;
    const businessUserId =  p.application.opportunity.business.userId;
    const authorId = about === 'TALENT' ? businessUserId : talentUserId;
    const otherId = about === 'TALENT' ? talentUserId : businessUserId ;

    const given = p.feedback.find((f) => f.authorUserId ===  authorId);
    if (!given) continue;
    const reciprocated = p.feedback.some((f) =>  f.authorUserId === otherId);
    if (!isVisible(p.completedAt, reciprocated)) continue;

    out.push({
      key: about === 'TALENT' ? p.application.talentProfileId : p.application.opportunity.businessProfileId,
      rating: given.rating,
      comment:given.comment,
      createdAt: given.createdAt,
      from:  about === 'TALENT' ? p.application.opportunity.business.organisationName : p.application.talentProfile.fullName,
      title: p.application.opportunity.title,

    });
  }
  return out;
}

function summarise(items: Item[]): Map<string, RatingSummary> {
  const sums = new Map<string, {total: number, count:  number}>();
  for ( const i of items) {
    const s  = sums.get(i.key) ?? { total: 0, count: 0};
    s.total += i.rating;
    s.count += 1;
    sums.set(i.key, s);
  }
  const out =  new Map<string, RatingSummary>();
  for (const [key, s] of sums) out.set(key, { average: Math.round((s.total / s.count) * 10) / 10, count: s.count});
  return out;
}

function newest(items: Item[]): ReviewItem[] {
  return items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)
    .map((i) => ({ rating:  i.rating, comment: i.comment,  createdAt: i.createdAt, from: i.from, title: i.title }));
}

export async function talentRatings(ids: string[]): Promise<Map<string , RatingSummary>> {
  if (ids.length === 0) return new Map();
  return summarise(await visibleItems({ application: { talentProfileId: { in:  ids } } }, 'TALENT'));
}

export async function businessRatings(ids: string[]): Promise<Map<string , RatingSummary>> {
  if (ids.length === 0) return new Map();
  return summarise(await visibleItems({ application: { opportunity: { businessProfileId: { in: ids } } } }, 'BUSINESS'));
}

export async function talentReviews(ids: string[]): Promise<ReviewItem[]> {
  return newest(await visibleItems({ application: { talentProfileId: { in: ids } } }, 'TALENT'));
}

export async function businessReviews(ids: string[]): Promise<ReviewItem[]> {
  return newest(await visibleItems({ application: { opportunity: { businessProfileId: { in: ids } } } }, 'BUSINESS'));
} 