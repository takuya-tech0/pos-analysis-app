//cd pos-analysis-app && npm run dev
"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Quagga from 'quagga';

export default function Home() {
  const [code, setCode] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [purchaseList, setPurchaseList] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountWithoutTax, setTotalAmountWithoutTax] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initQuagga = () => {
      if (videoRef.current) {
        Quagga.init({
          inputStream: {
            type: 'LiveStream',
            target: videoRef.current,
            constraints: {
              facingMode: 'environment'
            }
          },
          decoder: {
            readers: ['ean_reader', 'ean_8_reader']
          }
        }, (err) => {
          if (err) {
            console.error(err);
            return;
          }
          Quagga.start();
        });

        Quagga.onDetected((data) => {
          const scannedCode = data.codeResult.code;
          setCode(scannedCode);
          handleScan(scannedCode);
          Quagga.stop();
        });
      }
    };

    initQuagga();

    return () => {
      Quagga.stop();
    };
  }, [videoRef]);

  const handleScan = async (scannedCode: string) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/product/${scannedCode}`);
      const product = response.data;
      setProductName(product.name);
      setProductPrice(product.price);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProductName('商品がマスタ未登録です');
      setProductPrice('');
    }
  };

  const handleAdd = () => {
    setPurchaseList([...purchaseList, { code, name: productName, price: productPrice }]);
    setProductName('');
    setProductPrice('');
    setCode('');
  };

  const handlePurchase = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/purchase', {
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
      const total = response.data.totalAmount;
      const totalWithoutTax = total / 1.1; // Assuming 10% tax rate
      setTotalAmount(total);
      setTotalAmountWithoutTax(totalWithoutTax);
      setShowPopup(true);
      setPurchaseList([]);
    } catch (error) {
      console.error('Error completing purchase:', error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setCode('');
    setProductName('');
    setProductPrice('');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ width: '400px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        <button
          onClick={() => {
            if (Quagga.initialized) {
              Quagga.start();
            } else {
              Quagga.init({
                inputStream: {
                  type: 'LiveStream',
                  target: videoRef.current,
                  constraints: {
                    facingMode: 'environment'
                  }
                },
                decoder: {
                  readers: ['ean_reader', 'ean_8_reader']
                }
              }, (err) => {
                if (err) {
                  console.error(err);
                  return;
                }
                Quagga.start();
              });
            }
          }}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer', marginBottom: '20px' }}
        >
          スキャン（カメラ）
        </button>
        <div ref={videoRef} style={{ width: '100%', height: '300px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#000' }} />
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={code}
            readOnly
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }}
          />
          <div style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '10px' }}>
            <span>{productName}</span>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
            <span>{productPrice}円</span>
          </div>
        </div>
        <button
          onClick={handleAdd}
          style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer', marginBottom: '20px' }}
        >
          追加
        </button>
        <div style={{ marginBottom: '20px' }}>
          <h2>購入リスト</h2>
          <ul style={{ listStyleType: 'none', padding: '0', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '150px', overflowY: 'scroll' }}>
            {purchaseList.map((item, index) => (
              <li key={index} style={{ padding: '5px 10px', borderBottom: '1px solid #ccc' }}>
                {item.name} x1 {item.price}円
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handlePurchase}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          購入
        </button>
        {showPopup && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', zIndex: 1000
          }}>
            <h3>購入完了</h3>
            <p>合計金額（税込）: {totalAmount}円</p>
            <p>合計金額（税抜）: {totalAmountWithoutTax.toFixed(2)}円</p>
            <button
              onClick={closePopup}
              style={{ padding: '10px', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
