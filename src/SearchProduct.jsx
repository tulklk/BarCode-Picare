import { useState } from 'react';
import './style/SearchProduct.css';
import BarcodeScanner from './BarcodeScanner';

export default function SearchProduct() {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  // const [loading, setLoading] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // const handleSearch = async (inputCode) => {
  //   const searchCode = inputCode || barcode;
  //   setError('');
  //   setProduct(null);
  //   try {
  //     setLoading(true); // ✅ Bắt đầu loading

  //     // const response = await fetch(`https://eclatduteint.vn/webhook/TonkhoBarcode?code=${searchCode}`);
  //     const response = await fetch(`https://eclatduteint.vn/webhook/TonkhoBarcode?code=${searchCode}`);

  //     const data = await response.json();

  //     if (!response.ok || !data || data.length === 0) {
  //       console.warn('API Response:', data);
  //       throw new Error('Không tìm thấy sản phẩm trong kho.');
  //     }

  //     setProduct(data);
  //     setError('');
  //   } catch (err) {
  //     console.error('Lỗi tìm kiếm:', err);
  //     setProduct(null);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false); // ✅ Kết thúc loading dù thành công hay lỗi
  //   }

  // };

  //Search code theo sản phẩm 
  const handleSearch = async () => {
    setError('');
    setProduct(null);
    try {
      const response = await fetch(`https://eclatduteint.vn/webhook/TonkhoBarcode?code=${barcode}`);
      if (!response.ok) throw new Error('Không tìm thấy sản phẩm hoặc có lỗi API');
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDateVN = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('vi-VN');
  };

  const groupedByLot = product?.reduce((acc, item) => {
    const lot = item.lot_no;
    if (!acc[lot]) {
      acc[lot] = {
        product_name: item.product_name,
        issue_date: item.issue_date,
        expire_date: item.expire_date,
        items: [],
      };
    }
    acc[lot].items.push(item);
    return acc;
  }, {});

  // const handleDetected = (code) => {
  //   setBarcode(code);              
  //   setIsScannerOpen(false);      
  //   handleSearch(code);            
  // };
  const handleDetected = async (searchCode) => {
    setBarcode(searchCode);
    setIsScannerOpen(false);

    try {
      const response = await fetch(`https://eclatduteint.vn/webhook/TonkhoBarcode?code=${searchCode}`);

      const data = await response.json();

      if (!response.ok || !data || data.length === 0) {
        throw new Error('Không tìm thấy sản phẩm trong kho.');
      }

      setProduct(data);
      setError('');
    } catch (err) {
      console.error('Lỗi khi quét:', err);
      setProduct(null);
      setError(err.message || 'Đã có lỗi xảy ra khi quét mã.');
    }
  };


  return (
    <div className="search-container">
      <h2>Tìm kiếm sản phẩm theo Barcode</h2>
      <input
        type="text"
        value={barcode}
        onChange={(e) => {
          const value = e.target.value;
          setBarcode(value);
          if (value.trim() === '') {
            setProduct(null);
            setError('');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
        placeholder="Nhập hoặc quét mã barcode..."
        autoFocus
      />

      <div className="button-group">
        <button onClick={handleSearch}>🔍 Tìm kiếm</button>
        <button onClick={() => setIsScannerOpen(true)}>📷 Quét mã</button>
      </div>

      {/* {loading && (
        <p style={{ color: '#00784C', fontStyle: 'italic', marginTop: '10px' }}>
          🔄 Đang tìm kiếm sản phẩm, vui lòng chờ...
        </p>
      )} */}


      {isScannerOpen && (
        <BarcodeScanner
          onDetected={handleDetected}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {error && <p className="error">{error}</p>}

      {product && Object.keys(groupedByLot).length > 0 && (
        <div className="product-info">
          <h3>Kết quả tìm kiếm cho mã: <strong>{barcode}</strong></h3>
          {Object.entries(groupedByLot).map(([lot, lotInfo]) => (
            <div key={lot} className="product-lot">
              <p><strong>Lô:</strong> {lot}</p>
              <p><strong>Tên sản phẩm:</strong> {lotInfo.product_name}</p>
              <p><strong>NSX:</strong> {formatDateVN(lotInfo.issue_date)} | <strong>HSD:</strong> {formatDateVN(lotInfo.expire_date)}</p>
              {lotInfo.items.map((entry, idx) => (
                <div key={idx} className="product-storage">
                  <p><strong>Kho:</strong> {entry.storage}</p>
                  <p>Số lượng: {entry.quantity <= 0 ? <span style={{ color: 'red', fontWeight: 'bold' }}>Hết hàng</span> : entry.quantity}</p>
                  <p>Giá bán: {entry.giaban ? `${Number(entry.giaban).toLocaleString('vi-VN')} VNĐ` : '—'}</p>
                  <p>Thành tiền: {entry.quantity <= 0 ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>Sản phẩm hết hàng</span>
                  ) : (
                    `${Number(entry.thanhtien).toLocaleString('vi-VN')} VNĐ`
                  )}
                  </p>
                  <hr />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
