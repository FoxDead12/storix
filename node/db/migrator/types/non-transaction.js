export default class MigrationWithoutTransaction {

  static db;
  static async perform (action, db, schema_table) {
    this.db = db;

    console.log(`======================> ${this.name}`);

    try {

      if (action == 'up') {
        await this.up();
      }
      else if (action == 'down') {
        await this.down();
      }

      console.log(`${this.name} <======================`);

    } catch (err) {
      console.error(`Erro na migração ${this.name}:`, err.message);
      throw err;
    }

  }

  static async execute (query, params = []) {
    console.log(query);
    await this.db.query(query, params);
  }

}
