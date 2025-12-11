export default class StorixRoutes {

  components = {
    '/gallery': 'storix-photos',
    '/files': 'storix-files'
  }

  getComponentFromRoute (url) {
    return this.components[url];
  }

}
