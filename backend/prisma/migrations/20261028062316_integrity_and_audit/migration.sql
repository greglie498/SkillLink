-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data integrity: CHECK constraints 
ALTER TABLE "users" ADD CONSTRAINT "user_email_lowercase_chk"
    CHECK ("email" = lower("email"));
ALTER TABLE "users" ADD CONSTRAINT "users_email_length_chk"
    CHECK (char_length("email") <= 254);

ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_headline_len_chk"
    CHECK ("headline" IS NULL OR char_length("headline") <= 80);
ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_bio_len_chk"
    CHECK ("bio" IS NULL OR char_length("bio") <= 300);
ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profile_availabilty_len_chk"
    CHECK ("availability" IS NULL OR char_length("availability") <= 60);

ALTER TABLE "education" ADD CONSTRAINT "education_year_range_chk"
    CHECK (("start_year" IS NULL OR "start_year" BETWEEN 1950 AND 2100)
        AND ("end_year" IS NULL OR "end_year" BETWEEN 1950 AND 2100));
ALTER TABLE "education" ADD CONSTRAINT "education_year_order_chk"
    CHECK (("start_year" IS NULL OR "end_year" IS NULL OR "end_year" >= "start_year"));

ALTER TABLE "opportunities"  ADD CONSTRAINT "opportunities_compensation_chk"
    CHECK ("compensation_amount" IS NULL OR "compensation_amount" >= 0);
ALTER TABLE "opportunities"  ADD CONSTRAINT "opportunities_duration_chk"
    CHECK ("duration_weeks" IS NULL OR "duration_weeks" > 0);

ALTER TABLE "projects" ADD CONSTRAINT "projects_dates_chk"
    CHECK ("started_at" IS NULL OR "completed_at" IS NULL OR "completed_at" >= "started_at");

ALTER TABLE "feedback" ADD CONSTRAINT "feedback_rating_chk"
    CHECK ("rating" BETWEEN 1 AND 5);