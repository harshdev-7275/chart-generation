# models.py
import sqlalchemy
from db import metadata

india_revenue = sqlalchemy.Table(
    "india_revenue",
    metadata,
    sqlalchemy.Column("year", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("revenue", sqlalchemy.BigInteger),
)

sports_data = sqlalchemy.Table(
    "sports_data",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("sport", sqlalchemy.String),
    sqlalchemy.Column("year", sqlalchemy.Integer),
    sqlalchemy.Column("medals", sqlalchemy.Integer),
    sqlalchemy.Column("participants", sqlalchemy.Integer),
    sqlalchemy.Column("budget", sqlalchemy.BigInteger),
    sqlalchemy.Column("viewership", sqlalchemy.BigInteger),
    sqlalchemy.Column("revenue", sqlalchemy.BigInteger),
)
