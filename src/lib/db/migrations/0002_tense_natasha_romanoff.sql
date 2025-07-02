ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "Users can view their own profile" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Users can update their own profile" ON "users" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "document_collaborators" DROP CONSTRAINT "document_collaborators_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "document_versions" DROP CONSTRAINT "document_versions_created_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_author_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_comments_user_id";--> statement-breakpoint
DROP INDEX "idx_document_collaborators_user_id";--> statement-breakpoint
DROP INDEX "idx_documents_author_id";--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "document_collaborators" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "document_collaborators" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document_collaborators" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "document_versions" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "document_versions" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document_versions" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "author_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "author_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_user_id" ON "comments" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_collaborators_user_id" ON "document_collaborators" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_author_id" ON "documents" USING btree ("author_id" text_ops);