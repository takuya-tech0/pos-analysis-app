import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const base_path = path.resolve('.');
const ssl_cert_path = path.join(base_path, 'DigiCertGlobalRootG2.crt.pem');

const dbConfig = {
  host: 'tech0-db-step4-studentrdb-3.mysql.database.azure.com',
  user: 'tech0gen7student',
  password: 'vY7JZNfU',
  database: 'pos_lego',
  ssl: {
    ca: fs.readFileSync(ssl_cert_path)
  }
};
  
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: '商品コードが必要です' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT NAME, PRICE FROM products WHERE CODE = ?', [code]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ error: '商品が見つかりませんでした' });
    }

    const product = rows[0];
    return res.status(200).json({ name: product.NAME, price: product.PRICE });
  } catch (error) {
    console.error('データベースエラー:', error);
    return res.status(500).json({ error: 'データベースエラー' });
  }
};
