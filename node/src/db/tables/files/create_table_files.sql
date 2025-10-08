CREATE TABLE files (
  id                SERIAL        PRIMARY KEY,
  format            TEXT          NOT NULL,
  size              BIGINT        NOT NULL,
  path              TEXT          NOT NULL,
  folder_id         INTEGER       NOT NULL,     DEFAULT 0,    -- WILL ALWAYS EXIST A FOLDER WITH THIS ID
  user_id           INTEGER       NOT NULL      DEFAULT NULL, -- IN MIGRATION CHANGE TO USER ID
  create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
  update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
);
