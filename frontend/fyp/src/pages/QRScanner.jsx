import React, { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScanner = ({ onScanSuccess, onClose }) => {
  const [errorDesc, setErrorDesc] = useState("");

  useEffect(() => {
    let mounted = true;
    let scanner = null;
    let timer = null;

    const startScanner = async () => {
      // Clean up previous elements just in case of React StrictMode double render
      const readerElem = document.getElementById("qr-reader");
      if (readerElem) {
        readerElem.innerHTML = "";
      }

      scanner = new Html5Qrcode("qr-reader");

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (mounted) {
              scanner.pause(true);
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore normal scanning errors (e.g., no qr code found)
          }
        );

        if (!mounted) {
          // If unmounted while waiting for camera to start
          await scanner.stop();
          scanner.clear();
        }
      } catch (err) {
        if (mounted) {
          console.error("Error starting scanner:", err);
          setErrorDesc("Unable to access camera or start scanner. Please ensure camera permissions are granted.");
        }
      }
    };

    // Delay start slightly to bypass React 18 Strict Mode double mount
    timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      if (scanner) {
        try {
          // 2 = Html5QrcodeScannerState.SCANNING
          if (scanner.getState() === 2) {
            scanner.stop().then(() => scanner.clear()).catch(console.warn);
          }
        } catch (err) {
          console.warn("Error stopping scanner on unmount:", err);
        }
      }
    };
  }, [onScanSuccess]);

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <div className="si-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
      <div className="si-modal" style={{ maxWidth: "400px" }}>
        <div className="si-modal__header">
          <h2>📱 Scan QR Code</h2>
          <button className="si-modal__close" onClick={handleCancel}>✕</button>
        </div>
        
        {errorDesc && (
          <div style={{ color: "#ef4444", padding: "10px", margin: "10px", backgroundColor: "#fee2e2", borderRadius: "8px", fontSize: "14px" }}>
            {errorDesc}
          </div>
        )}

        <div style={{ padding: "0 20px" }}>
          <div
            id="qr-reader"
            style={{
              width: "100%",
              minHeight: "250px",
              border: "2px dashed #ccc",
              borderRadius: "8px",
              margin: "20px auto",
              overflow: "hidden",
            }}
          ></div>
        </div>

        <div className="si-form__actions" style={{ padding: "0 20px 20px" }}>
          <button type="button" className="si-btn-cancel" onClick={handleCancel} style={{ width: "100%" }}>
            Cancel Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
