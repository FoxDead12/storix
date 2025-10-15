CREATE TABLE users (
  id                SERIAL        PRIMARY KEY,
  name              TEXT          NOT NULL,
  email             TEXT          NOT NULL      UNIQUE  CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  encrypt_password  VARCHAR(64)   NOT NULL              CHECK (encrypt_password <> ''),
  u_schema          TEXT          NOT NULL,
  deleted           BOOLEAN       NOT NULL      DEFAULT FALSE,
  active            BOOLEAN       NOT NULL      DEFAULT FALSE,
  role_mask         BIT(8)        NOT NULL      DEFAULT B'00000000',
  create_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
  update_at         TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id                SERIAL        PRIMARY KEY,
  role              BIT(8)        NOT NULL,
  name              VARCHAR(255)  NOT NULL
);

INSERT INTO roles (role, name) VALUES
  (B'00000001', 'USER'),
  (B'00000010', 'ADMIN');
