# uvicorn pos-analysis-app.backend.main_extended:app --reload

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

class ProductSearch(BaseModel):
    code: str

class PurchaseItem(BaseModel):
    id: int
    code: str
    name: str
    price: int

class Purchase(BaseModel):
    employeeCode: str
    storeCode: str
    posId: str
    items: list[PurchaseItem]

@app.on_event("startup")
async def startup():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        # テーブルの自動作成
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            PRD_ID INT AUTO_INCREMENT PRIMARY KEY,
            CODE CHAR(13) UNIQUE,
            NAME VARCHAR(50),
            PRICE INT
        );
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            TRD_ID INT AUTO_INCREMENT PRIMARY KEY,
            DATETIME DATETIME,
            EMP_CD VARCHAR(10),
            STORE_CD VARCHAR(5),
            POS_NO VARCHAR(3),
            TOTAL_AMT INT
        );
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transaction_details (
            TRD_ID INT,
            DTL_ID INT,
            PRD_ID INT,
            PRD_CODE CHAR(13),
            PRD_NAME VARCHAR(50),
            PRD_PRICE INT,
            PRIMARY KEY (TRD_ID, DTL_ID)
        );
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")

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

@app.post("/api/purchase")
async def purchase(purchase: Purchase):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = """
        INSERT INTO transactions (DATETIME, EMP_CD, STORE_CD, POS_NO, TOTAL_AMT)
        VALUES (NOW(), %s, %s, %s, 0)
        """
        cursor.execute(query, (purchase.employeeCode, purchase.storeCode, purchase.posId))
        trd_id = cursor.lastrowid

        total_amount = 0
        for item in purchase.items:
            query = """
            INSERT INTO transaction_details (TRD_ID, DTL_ID, PRD_ID, PRD_CODE, PRD_NAME, PRD_PRICE)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (trd_id, item.id, item.id, item.code, item.name, item.price))
            total_amount += item.price

        query = "UPDATE transactions SET TOTAL_AMT = %s WHERE TRD_ID = %s"
        cursor.execute(query, (total_amount, trd_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {"success": True, "totalAmount": total_amount}
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            raise HTTPException(status_code=500, detail="Something is wrong with the user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            raise HTTPException(status_code=500, detail="Database does not exist")
        else:
            raise HTTPException(status_code=500, detail=str(err))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
