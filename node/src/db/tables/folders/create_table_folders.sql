CREATE TABLE folders (
  id                SERIAL        PRIMARY KEY,
  description       TEXT          NOT NULL,
  parent_id         INTEGER                     DEFAULT NULL,
  parents_ids       INTEGER[]                   DEFAULT NULL,
  user_id           INTEGER       NOT NULL      DEFAULT NULL, -- IN MIGRATION CHANGE TO USER ID
  create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
  update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
);
