// Unidades del stock
module.exports = (sequelize, DataTypes) => {
  const Vehiculo = sequelize.define(
    "Vehiculo",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      marca: { type: DataTypes.STRING(40), allowNull: false },
      modelo: { type: DataTypes.STRING(100), allowNull: false },
      anio: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      segmento: { type: DataTypes.STRING(40), allowNull: false },
      condicion: { type: DataTypes.ENUM("0km", "Usado Seleccionado"), allowNull: false, defaultValue: "Usado Seleccionado" },
      km: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      transmision: { type: DataTypes.ENUM("Automática", "Manual"), allowNull: false, defaultValue: "Automática" },
      combustible: { type: DataTypes.ENUM("Nafta", "Diésel", "Híbrido", "Eléctrico", "GNC"), allowNull: false, defaultValue: "Nafta" },
      precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      destacado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "vehiculo" }
  );

  Vehiculo.associate = (db) => {
    Vehiculo.hasMany(db.VehiculoImagen, { as: "imagenes", foreignKey: "vehiculo_id", onDelete: "CASCADE" });
    Vehiculo.hasMany(db.Consulta, { as: "consultas", foreignKey: "vehiculo_id" });
  };

  return Vehiculo;
};
