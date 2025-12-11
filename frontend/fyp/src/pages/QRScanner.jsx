import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 150 },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanner();
        }
      )
      .catch((err) => console.error("Scanner start error:", err));

    const stopScanner = () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };

    return () => stopScanner(); // clean up on unmount
  }, []);

  const handleCancel = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current.clear())
        .catch(() => {});
    }
    onClose(); // close the scanner in parent
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
