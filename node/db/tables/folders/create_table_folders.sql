DROP FUNCTION IF EXISTS sharded.create_table_folders;
CREATE OR REPLACE FUNCTION sharded.create_table_folders (
  IN _user_id integer,
  IN _schema  text
) RETURNS void AS $BODY$
DECLARE
  _query  text;
BEGIN

  _query := format($$
    CREATE TABLE %1$I.folders (
      id                SERIAL        PRIMARY KEY,
      description       TEXT          NOT NULL,
      parent_id         INTEGER                     DEFAULT NULL,
      user_id           INTEGER       NOT NULL      DEFAULT %2$s, -- IN MIGRATION CHANGE TO USER ID
      create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
      update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
    );
  $$, _schema, _user_id);

  EXECUTE _query;

  RETURN;
END;
$BODY$ LANGUAGE 'plpgsql';
