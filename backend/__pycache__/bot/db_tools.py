import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

Session = sessionmaker(bind=engine)


def get_products(category=None, price=None, offert=None):
    query = "SELECT * FROM productos WHERE 1=1"
    params = {}

    if category:
        query += ' AND "Categoria" = :category'
        params["category"] = category

    if price:
        query += " AND precio <= :price"
        params["price"] = price

    if offert:
        query += ' AND "Oferta" IS NOT NULL'

    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        rows = result.mappings().all()
        return [dict(row) for row in rows]


def get_categories():
    query = 'SELECT DISTINCT "Categoria" FROM productos;'

    with engine.connect() as conn:
        result = conn.execute(text(query))
        rows = result.mappings().all()
        categories = []
        for row in rows:
            categories.append(row["Categoria"])

        return categories
