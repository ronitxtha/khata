import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  // Stop scanner safely
  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop(); // stop camera
      }
      await scannerRef.current.clear(); // clear DOM

      // Explicitly stop video tracks to turn off light
      const videoElem = document.querySelector("#qr-reader video");
      if (videoElem?.srcObject) {
        videoElem.srcObject.getTracks().forEach((track) => track.stop());
        videoElem.srcObject = null;
      }
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    }
  };

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    const startScanner = async () => {
      if (!scannerRef.current.isScanning) {
        try {
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 150 },
            (decodedText) => {
              onScanSuccess(decodedText);
              stopScanner();
            }
          );
        } catch (err) {
          console.error("Error starting scanner:", err);
        }
      }
    };

    startScanner();

    return () => stopScanner();
  }, [onScanSuccess]);

  const handleCancel = async () => {
    await stopScanner();
    onClose?.();
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <div
        id="qr-reader"
        style={{
          width: "250px",
          height: "200px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          margin: "auto",
        }}
      ></div>
      <button
        onClick={handleCancel}
        style={{
          display: "block",
          margin: "5px auto",
          padding: "5px 10px",
          background: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
};

export default QRScanner;
