
/**
 * Enum que indica los estados posibles de las cartas
 * 
 * @MINT indica que la carta esta conservada perfectamente
 * @NEAR_MINT indica que la carta esta conservada de forma casi perfecta
 * @EXCELLENT indica que la carta esta conservada de forma excelente
 * @GOOD indica que la carta esta conservada de buena forma
 * @LIGHT_PLAYED indica que la carta esta conservada de forma ligeramente desgastada
 * @PLAYED indica que la carta esta conservada de forma claramente desgastada
 * @POOR indica que la carta esta conservada de forma deplorable
 */
export enum TypeConditionCard{
  MINT = "Mint",
  NEAR_MINT = "Near Mint",
  EXCELLENT = "Excellent",
  GOOD = "Good",
  LIGHT_PLAYED = "Light Played",
  PLAYED = "Played",
  POOR = "Poor"
}