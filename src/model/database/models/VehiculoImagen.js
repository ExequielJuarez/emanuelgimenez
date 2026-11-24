// Fotos de un vehículo (orden 0 = portada)
module.exports = (sequelize, DataTypes) => {
  const VehiculoImagen = sequelize.define(
    "VehiculoImagen",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      vehiculo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      url: { type: DataTypes.STRING(255), allowNull: false },
      orden: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: "vehiculo_imagen" }
  );

  VehiculoImagen.associate = (db) => {
    VehiculoImagen.belongsTo(db.Vehiculo, { as: "vehiculo", foreignKey: "vehiculo_id" });
  };

  return VehiculoImagen;
};
