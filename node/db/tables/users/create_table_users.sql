CREATE TABLE users (
  id                SERIAL        PRIMARY KEY,
  name              TEXT          NOT NULL,
  email             TEXT          NOT NULL,
  encrypt_password  VARCHAR(64)   NOT NULL,
  u_schema          TEXT          NOT NULL,
  deleted           BOOLEAN       NOT NULL      DEFAULT FALSE,
  create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
  update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
);
