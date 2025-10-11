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
