import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatTables1778144117397 implements MigrationInterface {
    name = 'ChatTables1778144117397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uniq_product_primary_image"`);
        await queryRunner.query(`CREATE TABLE "chat_rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "product_id" uuid NOT NULL, "buyer_id" uuid NOT NULL, "seller_id" uuid NOT NULL, "last_message_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_af114075da92c1538176cda74b9" UNIQUE ("product_id", "buyer_id", "seller_id"), CONSTRAINT "PK_c69082bd83bffeb71b0f455bd59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ac9430b03f1e29c05f4186b4ad" ON "chat_rooms" ("seller_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_066a893cf091bfa9e33e4f8f2d" ON "chat_rooms" ("buyer_id") `);
        await queryRunner.query(`CREATE TYPE "public"."chat_messages_message_type_enum" AS ENUM('text', 'image', 'system')`);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "room_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "message_type" "public"."chat_messages_message_type_enum" NOT NULL DEFAULT 'text', "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_329d6a183675e09d59343b67ab" ON "chat_messages" ("room_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "product_variants" ALTER COLUMN "attributes" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "images" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "data" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_2050db3c5eeb565e2c9b3c82d2c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_066a893cf091bfa9e33e4f8f2d0" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_ac9430b03f1e29c05f4186b4ad1" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_7f52e11d11d4e8cc41224352869" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_7f52e11d11d4e8cc41224352869"`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_ac9430b03f1e29c05f4186b4ad1"`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_066a893cf091bfa9e33e4f8f2d0"`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_2050db3c5eeb565e2c9b3c82d2c"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "data" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "images" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "payload" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "product_variants" ALTER COLUMN "attributes" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_329d6a183675e09d59343b67ab"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TYPE "public"."chat_messages_message_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_066a893cf091bfa9e33e4f8f2d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac9430b03f1e29c05f4186b4ad"`);
        await queryRunner.query(`DROP TABLE "chat_rooms"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uniq_product_primary_image" ON "product_images" ("product_id") WHERE (is_primary = true)`);
    }

}
