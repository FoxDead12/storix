DROP FUNCTION IF EXISTS functions.trf_after_insert_user;
CREATE OR REPLACE FUNCTION functions.trf_after_insert_user ()
RETURNS trigger AS $BODY$
BEGIN

  -- ... Create schema to user after been created ...
  PERFORM sharded.create_user_schema(NEW.id, NEW.u_schema);
  RETURN NULL;

END;
$BODY$ LANGUAGE 'plpgsql';
