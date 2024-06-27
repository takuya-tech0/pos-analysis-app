import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const dbConfig = {
  host: 'tech0-db-step4-studentrdb-3.mysql.database.azure.com',
  user: 'tech0gen7student',
  password: 'vY7JZNfU',
  database: 'pos_lego',
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), 'BaltimoreCyberTrustRoot.crt.pem'))
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeCode, storeCode, posId, items } = req.body;

  if (!employeeCode || !storeCode || !posId || !items || items.length === 0) {
    return res.status(400).json({ error: '必要なデータがありません' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO transactions (DATETIME, EMP_CD, STORE_CD, POS_NO, TOTAL_AMT) VALUES (NOW(), ?, ?, ?, 0)',
      [employeeCode, storeCode, posId]
    );

    const transactionId = result.insertId;

    let totalAmount = 0;

    for (const item of items) {
      await connection.execute(
        'INSERT INTO transaction_details (TRD_ID, DTL_ID, PRD_ID, PRD_CODE, PRD_NAME, PRD_PRICE) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, item.id, item.code, item.code, item.name, item.price]
      );
      totalAmount += item.price;
    }

    await connection.execute(
      'UPDATE transactions SET TOTAL_AMT = ? WHERE TRD_ID = ?',
      [totalAmount, transactionId]
    );

    await connection.commit();
    connection.end();

    res.status(200).json({ totalAmount });
  } catch (error) {
    res.status(500).json({ error: 'データベースエラー' });
  }
};
