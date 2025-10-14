export default class ROLES {

  roles = {};

  constructor (roles) {
    for (const role of roles) {
      this.roles[role.name] = parseInt(role.role, 2);
    }
  }

  static tranform_byte_to_hex (byte) {
    return '0x' + parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase();
  }

}
