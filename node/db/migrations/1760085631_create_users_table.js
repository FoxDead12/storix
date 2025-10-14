import MigrationTransaction from "../migrator/types/transaction.js";

export default class CreateUsersTable extends MigrationTransaction {

  static async up () {

    // ... create necessary schemas to project ...
    await this.execute(`
      CREATE SCHEMA IF NOT EXISTS sharded;
      CREATE SCHEMA IF NOT EXISTS functions;
    `);

    // ... create table user ...
    await this.execute(`
      CREATE TABLE users (
        id                SERIAL        PRIMARY KEY,
        name              TEXT          NOT NULL,
        email             TEXT          NOT NULL      UNIQUE  CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
        encrypt_password  VARCHAR(64)   NOT NULL              CHECK (encrypt_password <> ''),
        u_schema          TEXT          NOT NULL,
        deleted           BOOLEAN       NOT NULL      DEFAULT FALSE,
        active            BOOLEAN       NOT NULL      DEFAULT FALSE,
        role_mask         BIT(8)        NOT NULL      DEFAULT B'00000000',
        create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
        update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE roles (
        id                SERIAL        PRIMARY KEY,
        role              BIT(8)        NOT NULL,
        name              VARCHAR(255)  NOT NULL
      );

      INSERT INTO roles (role, name) VALUES
        (B'00000001', 'READ'),
        (B'00000010', 'WRITE'),
        (B'00000100', 'DELETE'),
        (B'00001000', 'ADMIN');
    `);

    // ... create triggers ...
    await this.execute(`
      DROP FUNCTION IF EXISTS functions.trf_before_insert_user;
      CREATE OR REPLACE FUNCTION functions.trf_before_insert_user ()
      RETURNS trigger AS $BODY$
      BEGIN
        NEW.u_schema := format('user_%s', to_char(NEW.id, 'FM0000'));
        RETURN NEW;
      END;
      $BODY$ LANGUAGE 'plpgsql';
    `);

    await this.execute(`
      DROP FUNCTION IF EXISTS functions.trf_after_insert_user;
      CREATE OR REPLACE FUNCTION functions.trf_after_insert_user ()
      RETURNS trigger AS $BODY$
      BEGIN

        -- ... Create schema to user after been created ...
        PERFORM sharded.create_user_schema(NEW.id, NEW.u_schema);
        RETURN NULL;

      END;
      $BODY$ LANGUAGE 'plpgsql';
    `);

    // ... attach triggers to table ...
    await this.execute(`
      CREATE TRIGGER trg_before_insert_user
      BEFORE INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION functions.trf_before_insert_user();
    `);

    await this.execute(`
      CREATE TRIGGER trg_after_insert_user
      AFTER INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION functions.trf_after_insert_user();
    `);

  }

  static async down () {

    await this.execute(`
      DROP TRIGGER trg_before_insert_user ON public.users;
    `);

    await this.execute(`
      DROP FUNCTION IF EXISTS functions.trf_before_insert_user;
    `);

    await this.execute(`
      DROP TABLE IF EXISTS public.users;
    `);
  }

}
