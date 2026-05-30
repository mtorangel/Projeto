import psycopg

passwords = ["M5t5o8r6", "(M5t5o8r6)", "postgres", "admin", "123456", "root"]
db_name = "postgres"
user = "postgres"
host = "localhost"
port = "5432"

for pwd in passwords:
    try:
        print(f"Testing password: {pwd} ...")
        conn = psycopg.connect(
            dbname=db_name,
            user=user,
            password=pwd,
            host=host,
            port=port
        )
        print(f"--> SUCCESS with password: {pwd}")
        conn.close()
        break
    except Exception as e:
        print(f"--> FAILED with password: {pwd}")
