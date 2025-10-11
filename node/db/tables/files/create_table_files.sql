DROP FUNCTION IF EXISTS sharded.create_table_files;
CREATE OR REPLACE FUNCTION sharded.create_table_files (
  IN _user_id integer,
  IN _schema  text
) RETURN void AS $BODY$
DECLARE
  _query  text;
BEGIN

  _query := format($$
    CREATE TABLE %1$I.files (
      id                SERIAL        PRIMARY KEY,
      format            TEXT          NOT NULL,
      size              BIGINT        NOT NULL,
      path              TEXT          NOT NULL,
      folder_id         INTEGER       NOT NULL,     DEFAULT %2$L,    -- WILL ALWAYS EXIST A FOLDER WITH THIS ID
      user_id           INTEGER       NOT NULL      DEFAULT NULL, -- IN MIGRATION CHANGE TO USER ID
      create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
      update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
    );
  $$, _schema, _user_id);

  EXECUTE _query;

END;
$BODY$ LANGUAGE 'plpgsql';
