DROP FUNCTION IF EXISTS sharded.create_user_schema;
CREATE OR REPLACE FUNCTION sharded.create_user_schema (
  IN _user_id integer,
  IN _schema  text
) RETURN void AS $BODY$
DECLARE
BEGIN



END;
$BODY$ LANGUAGE 'plpgsql';
