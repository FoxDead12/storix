import MigrationTransaction from "../migrator/types/transaction.js";

export default class CreateFunctionCreateSchema extends MigrationTransaction {

  static async up () {

    // ... sharded.create_user_schema ...
    await this.execute(`
      DROP FUNCTION IF EXISTS sharded.create_user_schema;
      CREATE OR REPLACE FUNCTION sharded.create_user_schema (
        IN _user_id integer,
        IN _schema  text
      ) RETURNS void AS $BODY$
      DECLARE
      BEGIN

        RAISE NOTICE '=====> Creating schema % to user %', _schema, _user_id;

        EXECUTE format($$
          CREATE SCHEMA IF NOT EXISTS %1$s;
        $$, _schema);

        -- ... Create folders table ...
        RAISE NOTICE '=====> Running sharded.create_table_folders';
        PERFORM sharded.create_table_folders(_user_id, _schema);

        -- ... Create files table ...
        RAISE NOTICE '=====> Running sharded.create_table_files';
        PERFORM sharded.create_table_files(_user_id, _schema);

        RETURN;
      END;
      $BODY$ LANGUAGE 'plpgsql';
    `);

    // ... sharded.get_user_schema ...
    await this.execute(`
      DROP FUNCTION IF EXISTS sharded.get_user_schema;
      CREATE OR REPLACE FUNCTION sharded.get_user_schema (
        IN _user_id integer,
        OUT _schema  text
      ) RETURNS text AS $BODY$
      DECLARE
        _query    text;
      BEGIN

        SELECT u_schema
          INTO _schema
          FROM public.users
        WHERE id = _user_id;

        IF _schema IS NULL THEN
          RAISE EXCEPTION 'USR001: User with id % does not exist in users', _user_id
            USING ERRCODE = 'A000';
        END IF;

      END;
      $BODY$ LANGUAGE 'plpgsql';
    `);

  }

  static async down () {

    await this.execute(``);

  }

}
