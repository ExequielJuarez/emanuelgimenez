// Administradores del panel
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      clave: { type: DataTypes.STRING(100), allowNull: false },
      rol: { type: DataTypes.ENUM("admin", "superadmin"), allowNull: false, defaultValue: "admin" },
      ultimo_acceso: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "usuario" }
  );
  return Usuario;
};
