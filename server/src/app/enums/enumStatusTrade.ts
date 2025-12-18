/**
 * Enum que indica el estado en el que se encuentra el intercambio
 * 
 * @PENDING indica que el intercambio esta pendiente de ejecutarse
 * @ACCEPTED indica que el intercambio se ha aceptado
 * @REJECTED indica que el intercambio se ha rechazado
 * @CANCELLED indica que el intercambio se ha cancelado
 */
export enum StatusTrade {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}