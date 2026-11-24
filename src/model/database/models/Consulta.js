// Consultas del formulario "Consultar con asesor"
module.exports = (sequelize, DataTypes) => {
  const Consulta = sequelize.define(
    "Consulta",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      telefono: { type: DataTypes.STRING(20), allowNull: false },
      mensaje: { type: DataTypes.STRING(500), allowNull: true },
      motivo: { type: DataTypes.STRING(160), allowNull: false },
      vehiculo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      estado: { type: DataTypes.ENUM("nueva", "contactado", "cerrada"), allowNull: false, defaultValue: "nueva" },
      nota: { type: DataTypes.STRING(500), allowNull: true },
    },
    { tableName: "consulta" }
  );

  Consulta.associate = (db) => {
    Consulta.belongsTo(db.Vehiculo, { as: "vehiculo", foreignKey: "vehiculo_id" });
  };

  return Consulta;
};
