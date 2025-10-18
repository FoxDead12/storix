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
