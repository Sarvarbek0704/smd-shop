import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductViewsAndSearch1778144392069 implements MigrationInterface {
  name = 'ProductViewsAndSearch1778144392069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "product_id" uuid NOT NULL, "session_id" character varying(128), "viewed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_30b2bf7f11bc3f9604ffc95dc89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db19370fda1bcf85ec8d2d24fe" ON "product_views" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ed19726483f66d6b8217f2c5d" ON "product_views" ("user_id", "viewed_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3229b85729591ce4a3c8427516" ON "product_views" ("product_id", "viewed_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "attributes" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ALTER COLUMN "images" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "data" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" ADD CONSTRAINT "FK_873f2ec00e65703da047e83e420" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" ADD CONSTRAINT "FK_ca78d95dae75fe32fa233c134fa" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // Full-Text Search indeksi
    await queryRunner.query(`
  ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED
`);

    await queryRunner.query(`
  CREATE INDEX IF NOT EXISTS "idx_products_search_vector"
  ON "products" USING GIN ("search_vector")
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_products_search_vector"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "search_vector"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" DROP CONSTRAINT "FK_ca78d95dae75fe32fa233c134fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_views" DROP CONSTRAINT "FK_873f2ec00e65703da047e83e420"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "data" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ALTER COLUMN "images" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payload" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "attributes" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3229b85729591ce4a3c8427516"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ed19726483f66d6b8217f2c5d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db19370fda1bcf85ec8d2d24fe"`,
    );
    await queryRunner.query(`DROP TABLE "product_views"`);
  }
}
