import psycopg

pwd = "admin"
user = "postgres"
host = "localhost"
port = "5432"

try:
    # Connect to default 'postgres' database to create the new one
    conn = psycopg.connect(
        dbname="postgres",
        user=user,
        password=pwd,
        host=host,
        port=port
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'indicadores_db';")
        exists = cur.fetchone()
        if not exists:
            print("Creating database indicadores_db...")
            cur.execute("CREATE DATABASE indicadores_db;")
        else:
            print("Database indicadores_db already exists.")
    conn.close()

    # Now connect to the new database to create the schema
    conn = psycopg.connect(
        dbname="indicadores_db",
        user=user,
        password=pwd,
        host=host,
        port=port
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        print("Creating schema ind...")
        cur.execute("CREATE SCHEMA IF NOT EXISTS ind;")
    conn.close()
    print("Database and schema setup complete!")
except Exception as e:
    print("Error: " + str(e))
