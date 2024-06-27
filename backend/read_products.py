import os
import mysql.connector
from mysql.connector import errorcode

# SSL証明書の絶対パスを取得
base_path = os.path.dirname(os.path.abspath(__file__))
ssl_cert_path = os.path.join(base_path, 'DigiCertGlobalRootG2.crt.pem')

# 接続設定
config = {
    'host': 'tech0-db-step4-studentrdb-3.mysql.database.azure.com',
    'user': 'tech0gen7student',
    'password': 'vY7JZNfU',  # パスワードを実際の値に置き換えてください
    'database': 'pos_lego',
    'client_flags': [mysql.connector.ClientFlag.SSL],
    'ssl_ca': ssl_cert_path
}

# 接続を確立
try:
    conn = mysql.connector.connect(**config)
    print("Connection established")
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with the user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print("Error:", err)
else:
    cursor = conn.cursor()
    print("Cursor created")

    # products テーブルのデータを取得
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()

    # 取得したデータをターミナルに出力
    for row in rows:
        print(f"ID: {row[0]}, CODE: {row[1]}, NAME: {row[2]}, PRICE: {row[3]}")

    # 接続を閉じる
    cursor.close()
    conn.close()
    print("Done.")
