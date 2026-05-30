import psycopg

pwd = "admin"
user = "postgres"
host = "localhost"
port = "5432"

try:
    conn = psycopg.connect(
        dbname="postgres",
        user=user,
        password=pwd,
        host=host,
        port=port
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SELECT datname FROM pg_database;")
        databases = cur.fetchall()
        print("Available databases:")
        for db in databases:
            print("- " + db[0])
    conn.close()
except Exception as e:
    print("Error: " + str(e))
