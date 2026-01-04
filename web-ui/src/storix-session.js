export default class StorixSession {

  static async fetchSession () {
    try {
      const data = await app.broker.get('session');
      app.session = data.response;
    } catch (e) {
      window.location.href = '/login';
    }
  }

  static async refreshToken () {
    setInterval(async () => {
      await app.broker.patch('session', {});
    }, 3400 * 1000)
  }

}
