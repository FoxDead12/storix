export default class ROLES {

  _roles = {};

  get roles () {
    return this._roles;
  }

  constructor (roles) {
    roles.map(role => this._roles[role.name] = parseInt(role.role, 2));
  }

  static tranform_byte_to_hex (byte) {
    return '0x' + parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase();
  }

}
