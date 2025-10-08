CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  name              TEXT                NOT NULL,
  email             TEXT                NOT NULL CHECK(email::text !~ '^[\s]*$'::text),
  encrypt_password  VARCHAR(64)         NOT NULL,
  u_schema          TEXT                NOT NULL,
  create_at         TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
  update_at         TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
