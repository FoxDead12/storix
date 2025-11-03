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
      uuid              VARCHAR(36)   NOT NULL,
      type              VARCHAR(10)   NOT NULL,
      extension         VARCHAR(10)                 DEFAULT NULL,
      size              BIGINT        NOT NULL,
      birthtime         TIMESTAMP     NOT NULL,
      path              TEXT          NOT NULL,
      description       VARCHAR(255)  NOT NULL,
      folder_id         INTEGER       NOT NULL      DEFAULT 0                   REFERENCES %1$I.folders,                           -- WILL ALWAYS EXIST A FOLDER WITH THIS ID
      user_id           INTEGER       NOT NULL      DEFAULT %2$s                REFERENCES public.users   CHECK (user_id = %2$s), -- IN MIGRATION CHANGE TO USER ID
      create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
      update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
    );
  $$, _schema, _user_id);

  EXECUTE _query;

  RETURN;
END;
$BODY$ LANGUAGE 'plpgsql';
