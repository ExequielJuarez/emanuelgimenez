// Fotos de clientes con su auto (sección "Clientes" del inicio)
module.exports = (sequelize, DataTypes) => {
  const ClienteFoto = sequelize.define(
    "ClienteFoto",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      url: { type: DataTypes.STRING(255), allowNull: false },
      titulo: { type: DataTypes.STRING(80), allowNull: true },
      orden: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "cliente_foto" }
  );
  return ClienteFoto;
};
