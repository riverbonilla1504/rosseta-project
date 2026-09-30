# ADR-0003 · Trabajo asíncrono con Celery + Redis

- **Estado:** Propuesto
- **Fecha:** 2026-09-29
- **Relacionado:** RNF-12, ROS-124, [03-backend.md §4](../03-backend.md)

## Contexto
Perfilar una muestra de decenas o cientos de MB y parsear un DDL de ~900 tablas puede tardar minutos. Hacerlo dentro de la petición HTTP bloquea la UI y choca con los timeouts (RNF-12).

## Decisión
- **Celery 5** como ejecutor de tareas, con **Redis 7** como broker y almacén de resultados.
- Redis también se usa como **caché** (métricas de cobertura, sesiones revocadas).
- La UI consulta el estado de la fuente por sondeo (`GET /api/sources/{id}`).

## Alternativas
| Opción | Por qué no |
|---|---|
| Django-Q2 / Huey | Menor adopción y documentación; Celery es el estándar con Django |
| Dramatiq + RabbitMQ | Un servicio más (RabbitMQ) sin ventaja para este volumen |
| Tareas en un hilo del proceso web | No sobrevive reinicios ni escala; sin reintentos |
| PostgreSQL como cola (p. ej. `procrastinate`) | Válido y evitaría Redis como broker, pero Redis igual se usa como caché; se prefiere el camino estándar |

## Consecuencias
- (+) Reintentos, visibilidad del estado, escalado del worker independiente.
- (−) **Dos servicios adicionales** a operar: Redis y el proceso worker.
- (−) Las tareas deben ser idempotentes (regla B6 de [03-backend.md](../03-backend.md)).
