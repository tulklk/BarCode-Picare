import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';


export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true); // iOS fix
          await videoRef.current.play();

          // Start decoding
          codeReader.current.decodeFromVideoElement(videoRef.current, (result, error) => {
            if (result) {
              onDetected(result.getText());
              stopScanner(); // Gọi sau khi đã phát hiện barcode
            }
            if (error && !(error instanceof NotFoundException)) {
              console.warn('Decode error:', error);
            }
          });
        }
      } catch (err) {
        console.error('Camera error:', err);
        onClose();
      }
    };

    const stopScanner = () => {
      // if (codeReader.current) {
      //   try {
      //     codeReader.current.reset(); // 🛑 reset chỉ tồn tại trong 1 số bản — bạn nên dùng cách tắt thủ công
      //   } catch (e) {
      //     console.warn('Không thể reset reader, dừng thủ công...');
      //   }
      // }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onDetected, onClose]);

  return (
    <div className="scanner-modal">
      <video ref={videoRef} style={{ width: '100%' }} />
      <div className="scanner-tips">
        <p>Hướng camera vào mã vạch sản phẩm</p>
        <button onClick={onClose}>❌ Đóng</button>
      </div>
    </div>
  );
}
