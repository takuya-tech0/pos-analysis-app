import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [code, setCode] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [purchaseList, setPurchaseList] = useState([]);
  
  const handleScan = async () => {
    try {
      const response = await axios.get(`/api/product?code=${code}`);
      const product = response.data;
      setProductName(product.name);
      setProductPrice(product.price);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handleAdd = () => {
    setPurchaseList([...purchaseList, { name: productName, price: productPrice }]);
    setProductName('');
    setProductPrice('');
    setCode('');
  };

  const handlePurchase = async () => {
    try {
      const response = await axios.post('/api/purchase', {
        employeeCode: '1234567890',
        storeCode: '30',
        posId: '90',
        items: purchaseList.map((item, index) => ({
          id: index + 1,
          code: item.code,
          name: item.name,
          price: item.price
        }))
      });
      alert(`購入が完了しました。合計金額は${response.data.totalAmount}円です。`);
      setPurchaseList([]);
    } catch (error) {
      console.error('Error completing purchase:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="商品コードを入力"
      />
      <button onClick={handleScan}>商品コード読み込み</button>
      <div>
        <span>{productName}</span>
        <span>{productPrice}円</span>
      </div>
      <button onClick={handleAdd}>追加</button>
      <div>
        <h2>購入リスト</h2>
        <ul>
          {purchaseList.map((item, index) => (
            <li key={index}>{item.name} x1 {item.price}円</li>
          ))}
        </ul>
      </div>
      <button onClick={handlePurchase}>購入</button>
    </div>
  );
}
