## ファイアーウォール設定のIPアドレス
#  curl ifconfig.me
## uvicorn pos-analysis-app.backend.main:app --reload

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import errorcode
import os

app = FastAPI()

# CORS設定を追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 許可するオリジンを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SSL証明書の絶対パスを取得
base_path = os.path.dirname(os.path.abspath(__file__))
ssl_cert_path = os.path.join(base_path, 'DigiCertGlobalRootG2.crt.pem')

# データベース接続設定
db_config = {
    'host': 'tech0-db-step4-studentrdb-3.mysql.database.azure.com',
    'user': 'tech0gen7student',
    'password': 'vY7JZNfU',
    'database': 'pos_lego',
    'client_flags': [mysql.connector.ClientFlag.SSL],
    'ssl_ca': ssl_cert_path
}

@app.get("/product/{code}")
async def get_product(code: str):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = "SELECT NAME, PRICE FROM products WHERE CODE = %s"
        cursor.execute(query, (code,))
        result = cursor.fetchone()

        if result:
            product_name, product_price = result
            return {"name": product_name, "price": product_price}
        else:
            raise HTTPException(status_code=404, detail="Product not found")

    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            raise HTTPException(status_code=500, detail="Something is wrong with the user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            raise HTTPException(status_code=500, detail="Database does not exist")
        else:
            raise HTTPException(status_code=500, detail=str(err))

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
