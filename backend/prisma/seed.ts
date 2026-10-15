import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  // Lookup data
  const categoryNames = ['Web Development', 'Mobile Development', 'Design', 'Content & Marketing', 'Data & Databases'];
  const typeNames = ['Project', 'Internship', 'Apprenticeship', 'Entry-Level'];
  const skillNames = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'React Native', 'Content Writing', 'Canva'];

  const categories = await Promise.all(
    categoryNames.map((name) => prisma.category.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const types = await Promise.all(
    typeNames.map((name) => prisma.opportunityType.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const skills = await Promise.all(
    skillNames.map((name) => prisma.skill.upsert({ where: { name }, update: {}, create: { name } }))
  );

  const categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const typeId = Object.fromEntries(types.map((t) => [t.name, t.id]));
  const skillId = Object.fromEntries(skills.map((s) => [s.name, s.id]));

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@skilllink.test' },
    update: {},
    create: { email: 'admin@skilllink.test', passwordHash, role: 'ADMIN', emailVerified: true },
  });

  // Talent
  await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      passwordHash,
      role: 'TALENT',
      emailVerified: true,
      talentProfile: {
        create: {
          fullName: 'Jane Wanjiru',
          headline: 'Frontend Developer | React & TypeScript',
          bio: 'Software engineering student passionate about building clean, usable web apps.',
          location: 'Nairobi, Kenya',
          availability: '10-15 hrs/week',
          skills: {
            create: [
              { skillId: skillId['React'], proficiency: 'ADVANCED' },
              { skillId: skillId['TypeScript'], proficiency: 'INTERMEDIATE' },
              { skillId: skillId['Tailwind CSS'], proficiency: 'INTERMEDIATE' },
            ],
          },
          education: {
            create: [
              { institution: 'USIU-Africa', qualification: 'BSc Software Engineering', startYear: 2022, endYear: 2026 },
            ],
          },
          portfolioLinks: {
            create: [{ title: 'Portfolio Site', url: 'https://example.com/jane' }],
          },
        },
      },
    },
  });

  // Business
  const businessUser = await prisma.user.upsert({
    where: { email: 'owner@nairobicrafts.test' },
    update: {},
    create: {
      email: 'owner@nairobicrafts.test',
      passwordHash,
      role: 'BUSINESS',
      emailVerified: true,
      businessProfile: {
        create: {
          organisationName: 'Nairobi Crafts Co.',
          industry: 'Retail',
          description: 'Handmade crafts retailer growing an online store.',
          contactPerson: 'Amina Otieno',
          location: 'Nairobi, Kenya',
          verification: 'VERIFIED',
        },
      },
    },
    include: { businessProfile: true },
  });

  // Opportunities (only seed once)
  if ((await prisma.opportunity.count()) === 0 && businessUser.businessProfile) {
    const businessProfileId = businessUser.businessProfile.id;

    await prisma.opportunity.create({
      data: {
        businessProfileId,
        categoryId: categoryId['Web Development'],
        typeId: typeId['Project'],
        title: 'Frontend Developer for E-commerce Site',
        description: 'Build responsive product and checkout pages for our online store.',
        durationWeeks: 3,
        compensationAmount: 25000,
        isRemote: true,
        location: 'Nairobi, Kenya',
        deadline: new Date('2026-11-15'),
        status: 'PUBLISHED',
        skills: { create: [{ skillId: skillId['React'] }, { skillId: skillId['Tailwind CSS'] }] },
      },
    });

    await prisma.opportunity.create({
      data: {
        businessProfileId,
        categoryId: categoryId['Data & Databases'],
        typeId: typeId['Project'],
        title: 'Database Design for Inventory App',
        description: 'Design and document a PostgreSQL schema for stock tracking.',
        durationWeeks: 1,
        compensationAmount: 15000,
        isRemote: true,
        deadline: new Date('2026-11-30'),
        status: 'PUBLISHED',
        skills: { create: [{ skillId: skillId['PostgreSQL'] }, { skillId: skillId['Prisma'] }] },
      },
    });

    await prisma.opportunity.create({
      data: {
        businessProfileId,
        categoryId: categoryId['Content & Marketing'],
        typeId: typeId['Internship'],
        title: 'Social Media Content Intern',
        description: 'Plan and draft a monthly content calendar.',
        durationWeeks: 8,
        compensationAmount: 8000,
        isRemote: false,
        location: 'Nairobi, Kenya',
        deadline: new Date('2026-12-05'),
        status: 'PUBLISHED',
        skills: { create: [{ skillId: skillId['Content Writing'] }, { skillId: skillId['Canva'] }] },
      },
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(() => prisma.$disconnect());