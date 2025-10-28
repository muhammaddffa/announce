-- CreateTable
CREATE TABLE "announcement_comments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_comment_id" UUID,
    "comment_text" TEXT NOT NULL,
    "is_edited" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_likes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_recipients" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID NOT NULL,
    "recipient_type" VARCHAR(20) NOT NULL,
    "recipient_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_shares" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID NOT NULL,
    "shared_by" UUID NOT NULL,
    "share_type" VARCHAR(50),
    "shared_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_tags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID NOT NULL,
    "tag_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_views" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "viewed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "announcement_cover_url" VARCHAR(500),
    "page_cover_url" VARCHAR(500),
    "content" TEXT,
    "status" VARCHAR(20) DEFAULT 'draft',
    "enable_comments" BOOLEAN DEFAULT false,
    "publish_date" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "views_count" INTEGER DEFAULT 0,
    "likes_count" INTEGER DEFAULT 0,
    "comments_count" INTEGER DEFAULT 0,
    "shares_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nik" VARCHAR(23) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "department_id" UUID,
    "password" VARCHAR(255),
    "email" VARCHAR(255),
    "position" VARCHAR(100),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_comments_parent" ON "announcement_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "idx_likes_announcement" ON "announcement_likes"("announcement_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_recipient" ON "announcement_recipients"("announcement_id", "recipient_type", "recipient_id");

-- CreateIndex
CREATE INDEX "idx_shares_user" ON "announcement_shares"("shared_by");

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_announcement_tag" ON "announcement_tags"("announcement_id", "tag_name");

-- CreateIndex
CREATE INDEX "idx_views_date" ON "announcement_views"("viewed_at");

-- CreateIndex
CREATE INDEX "idx_announcements_publish_date" ON "announcements"("publish_date");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nik_key" ON "employees"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "idx_employees_email" ON "employees"("email");

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "announcement_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "fk_recipient_employee" FOREIGN KEY ("recipient_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "fk_recipient_department" FOREIGN KEY ("recipient_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_shares" ADD CONSTRAINT "announcement_shares_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_shares" ADD CONSTRAINT "announcement_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_tags" ADD CONSTRAINT "announcement_tags_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
