export default class StorixSession {

  static async fetchSession () {
    try {
      const data = await app.broker.get('session');
      app.session = data.data;
    } catch (e) {
      window.location.href = '/login';
    }
  }

}
