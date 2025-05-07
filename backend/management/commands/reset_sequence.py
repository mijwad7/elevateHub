from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps

class Command(BaseCommand):
    help = 'Resets primary key sequences for all models to avoid IntegrityError.'

    def handle(self, *args, **options):
        self.stdout.write('Resetting primary key sequences for all models...')
        with connection.cursor() as cursor:
            for model in apps.get_models():
                table_name = model._meta.db_table
                sequence_name = f'{table_name}_id_seq'
                try:
                    # Get the maximum id from the table
                    cursor.execute(f'SELECT MAX(id) FROM {table_name}')
                    max_id = cursor.fetchone()[0] or 0
                    # Set the sequence to max_id + 1
                    cursor.execute(f'SELECT setval(\'{sequence_name}\', {max_id + 1}, true)')
                    self.stdout.write(f'Reset sequence for {table_name} to {max_id + 1}')
                except Exception as e:
                    self.stdout.write(f'Error resetting sequence for {table_name}: {str(e)}', style_func=self.style.ERROR)
        self.stdout.write(self.style.SUCCESS('All sequences reset successfully.'))