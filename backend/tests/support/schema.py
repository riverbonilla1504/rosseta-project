"""Lectura del esquema real de PostgreSQL para comparar con el diccionario de datos (FR-026).

Las pruebas del núcleo de datos comprueban la base, no solo los modelos: tipo, longitud,
nulabilidad, restricciones e índices tal como quedaron tras las migraciones.
"""

from dataclasses import dataclass

from django.db import connection


@dataclass(frozen=True)
class Column:
    data_type: str
    max_length: int | None
    precision: int | None
    scale: int | None
    nullable: bool


def columns(table: str) -> dict[str, Column]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            select column_name, data_type, character_maximum_length,
                   numeric_precision, numeric_scale, is_nullable
            from information_schema.columns
            where table_schema = current_schema() and table_name = %s
            """,
            [table],
        )
        return {
            name: Column(data_type, length, precision, scale, nullable == "YES")
            for name, data_type, length, precision, scale, nullable in cursor.fetchall()
        }


def foreign_key(table: str, column: str) -> tuple[str, str]:
    """(tabla referenciada, acción ON DELETE en la base: CASCADE, RESTRICT, NO ACTION…)."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            select ccu.table_name, rc.delete_rule
            from information_schema.key_column_usage kcu
            join information_schema.referential_constraints rc
              on rc.constraint_name = kcu.constraint_name
            join information_schema.constraint_column_usage ccu
              on ccu.constraint_name = kcu.constraint_name
            where kcu.table_name = %s and kcu.column_name = %s
            """,
            [table, column],
        )
        row = cursor.fetchone()
    assert row is not None, f"{table}.{column} no es una clave foránea"
    return row[0], row[1]


def check_definitions(table: str) -> list[str]:
    """Texto de cada CHECK de la tabla (pg_get_constraintdef), para comprobar enums y reglas."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            select pg_get_constraintdef(c.oid)
            from pg_constraint c join pg_class t on t.oid = c.conrelid
            where t.relname = %s and c.contype = 'c'
            """,
            [table],
        )
        return [row[0] for row in cursor.fetchall()]


def index_definitions(table: str) -> list[str]:
    with connection.cursor() as cursor:
        cursor.execute("select indexdef from pg_indexes where tablename = %s", [table])
        return [row[0] for row in cursor.fetchall()]
