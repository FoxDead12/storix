DROP FUNCTION IF EXISTS functions.trf_before_insert_user;
CREATE OR REPLACE FUNCTION functions.trf_before_insert_user ()
RETURNS trigger AS $BODY$
DECLARE
BEGIN

  NEW.u_schema := format('user_%s', to_char(NEW.id, 'FM0000'));
  RETURN NEW;

END;
$BODY$ LANGUAGE 'plpgsql';
