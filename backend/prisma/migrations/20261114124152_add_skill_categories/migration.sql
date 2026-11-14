-- Create skill_categories table
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
CREATE UNIQUE INDEX "skill_categories_name_key"
ON "skill_categories"("name");

-- Insert initial skill categories
INSERT INTO "skill_categories" ("id", "name")
VALUES
    (gen_random_uuid(), 'Technology & IT'),
    (gen_random_uuid(), 'Business & Administration'),
    (gen_random_uuid(), 'Finance & Accounting'),
    (gen_random_uuid(), 'Marketing & Sales'),
    (gen_random_uuid(), 'Creative Design & Media'),
    (gen_random_uuid(), 'Writing & Communication'),
    (gen_random_uuid(), 'Education & Training'),
    (gen_random_uuid(), 'Engineering & Technical Services'),
    (gen_random_uuid(), 'Customer Service & Hospitality'),
    (gen_random_uuid(), 'Research & Professional Services'),
    (gen_random_uuid(), 'Other');

-- Add category_id as nullable temporarily
ALTER TABLE "skills"
ADD COLUMN "category_id" UUID;

-- Assign existing skills to their appropriate categories
UPDATE "skills"
SET "category_id" = (
    SELECT "id" FROM "skill_categories"
    WHERE "name" = CASE
        WHEN "skills"."name" IN (
            'React',
            'TypeScript',
            'Node.js',
            'PostgreSQL',
            'Prisma',
            'Tailwind CSS',
            'React Native'
        ) THEN 'Technology & IT'

        WHEN "skills"."name" = 'Content Writing'
        THEN 'Writing & Communication'

        WHEN "skills"."name" = 'Canva'
        THEN 'Creative Design & Media'

        ELSE 'Other'
    END
);

-- Make category_id mandatory
ALTER TABLE "skills"
ALTER COLUMN "category_id" SET NOT NULL;

-- Create index
CREATE INDEX "skills_category_id_idx"
ON "skills"("category_id");

-- Add foreign key
ALTER TABLE "skills"
ADD CONSTRAINT "skills_category_id_fkey"
FOREIGN KEY ("category_id")
REFERENCES "skill_categories"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;