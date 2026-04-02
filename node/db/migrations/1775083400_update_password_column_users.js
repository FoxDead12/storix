import MigrationTransaction from "../migrator/types/transaction.js";

export default class UpdatePasswordColumnUsers extends MigrationTransaction {

  static async up () {
    await this.execute(`
      ALTER TABLE public.users ALTER COLUMN encrypt_password TYPE VARCHAR(255);
    `);
  }

  static async down () {}

}
