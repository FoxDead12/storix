import MigrationTransaction from "../migrator/types/transaction.js";

export default class CreateFunctionCreateSchema extends MigrationTransaction {

  static async up () {

    // ... sharded.create_table_files ...
    await this.execute(`
      DROP FUNCTION IF EXISTS sharded.create_table_files;
      CREATE OR REPLACE FUNCTION sharded.create_table_files (
        IN _user_id integer,
        IN _schema  text
      ) RETURNS void AS $BODY$
      DECLARE
        _query  text;
      BEGIN

        _query := format($$
          CREATE TABLE %1$I.files (
            id                SERIAL        PRIMARY KEY,
            format            TEXT          NOT NULL,
            size              BIGINT        NOT NULL,
            path              TEXT          NOT NULL,
            folder_id         INTEGER       NOT NULL     DEFAULT NULL,    -- WILL ALWAYS EXIST A FOLDER WITH THIS ID
            user_id           INTEGER       NOT NULL      DEFAULT %2$s, -- IN MIGRATION CHANGE TO USER ID
            create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
            update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
          );
        $$, _schema, _user_id);

        EXECUTE _query;

        RETURN;
      END;
      $BODY$ LANGUAGE 'plpgsql';
    `);

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
        RAISE NOTICE '=====> Running sharded.create_table_files';
        PERFORM sharded.create_table_files(_user_id, _schema);

        -- ... Create files table ...
        RAISE NOTICE '=====> Running sharded.create_table_folders';
        PERFORM sharded.create_table_folders(_user_id, _schema);

        RETURN;
      END;
      $BODY$ LANGUAGE 'plpgsql';
    `);
  }

  static async down () {

    await this.execute(``);

  }

}
