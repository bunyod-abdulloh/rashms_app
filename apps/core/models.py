from django.db import models

class Users(models.Model):
    id = models.AutoField(primary_key=True)
    telegram_id = models.BigIntegerField()
    fullname = models.CharField(max_length=255)

    class Meta:
        db_table = "users"
        managed = False





