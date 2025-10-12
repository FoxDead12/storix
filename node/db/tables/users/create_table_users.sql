CREATE TABLE users (
  id                SERIAL        PRIMARY KEY,
  name              TEXT          NOT NULL,
  email             TEXT          NOT NULL      UNIQUE  CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  encrypt_password  VARCHAR(64)   NOT NULL              CHECK (encrypt_password <> ''),
  u_schema          TEXT          NOT NULL,
  deleted           BOOLEAN       NOT NULL      DEFAULT FALSE,
  create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
  update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
);
