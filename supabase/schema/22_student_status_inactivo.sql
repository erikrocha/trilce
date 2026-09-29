-- ============================================================================
-- 22. Estado "inactivo" para alumnos
-- ============================================================================
-- Un alumno inactivo se oculta de la operación diaria (lista de alumnos por
-- defecto, cobros pendientes, registrar pago, cuestionarios, juegos) sin
-- borrarlo. Pensado para alumnos de prueba/demo: se activan para probar y se
-- desactivan después, conservando sus cobros y pagos.
--
-- Es distinto de "retirado": un retirado es un alumno real que dejó el colegio
-- y sigue apareciendo (con su deuda) en tesorería.

alter type student_status add value if not exists 'inactivo';
