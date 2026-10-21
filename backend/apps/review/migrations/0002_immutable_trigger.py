"""Trigger BEFORE UPDATE OR DELETE de review_review_action (diccionario de datos; FR-023).

Garantiza en la base que una acción humana registrada no se modifica ni se borra, también con
SQL directo o QuerySet.update(). TRUNCATE no dispara triggers de fila.
"""

from django.db import migrations

FORWARD = """
create function review_review_action_immutable() returns trigger
language plpgsql as $$
begin
    raise exception 'review_review_action es inmutable: no se modifica ni se borra (FR-023)';
end;
$$;

create trigger review_review_action_immutable
before update or delete on review_review_action
for each row execute function review_review_action_immutable();
"""

REVERSE = """
drop trigger if exists review_review_action_immutable on review_review_action;
drop function if exists review_review_action_immutable();
"""


class Migration(migrations.Migration):
    dependencies = [("review", "0001_initial")]

    operations = [migrations.RunSQL(FORWARD, REVERSE)]
