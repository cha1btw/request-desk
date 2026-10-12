import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientsRequestsComments1791804348000 implements MigrationInterface {
  name = 'CreateClientsRequestsComments1791804348000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE TYPE "request_status" AS ENUM ('new', 'in_progress', 'done')`);
    await queryRunner.query(`
      CREATE TABLE "requests" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "status" "request_status" NOT NULL DEFAULT 'new',
        "client_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        -- RESTRICT: a client that still has requests cannot be deleted
        CONSTRAINT "FK_requests_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_requests_status" ON "requests" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_requests_client_id" ON "requests" ("client_id")`);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" SERIAL PRIMARY KEY,
        "text" text NOT NULL,
        "request_id" integer NOT NULL,
        "author_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        -- CASCADE: deleting a request deletes its comments
        CONSTRAINT "FK_comments_request" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_comments_request_id" ON "comments" ("request_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TYPE "request_status"`);
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}
