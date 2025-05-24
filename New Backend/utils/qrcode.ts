import QRCode from 'qrcode';
import crypto from 'crypto';
import jwt from '../config/jwt.js';

// Generate QR code for an outpass
export const generateQRCode = async (
  outpassData: {
    outpassId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    startDateTime: Date;
    endDateTime: Date;
  }
): Promise<{ qrCodeBase64: string; tokenHash: string }> => {
  // Generate a JWT token for the outpass with expiration matching the end date
  const expirationTime = Math.floor(
    (new Date(outpassData.endDateTime).getTime() - new Date().getTime()) / 1000
  );
  const expiresIn = `${expirationTime}s`;
  
  // Create the token with all necessary data
  const token = jwt.generateOutpassToken(
    {
      outpassId: outpassData.outpassId,
      studentId: outpassData.studentId,
      studentName: outpassData.studentName,
      rollNumber: outpassData.rollNumber,
      startDateTime: outpassData.startDateTime.toISOString(),
      endDateTime: outpassData.endDateTime.toISOString(),
    },
    expiresIn
  );
  
  // Hash the token for storage in database (for verification without decoding)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Create a data object that includes the token
  const qrData = JSON.stringify({
    token,
    studentName: outpassData.studentName,
    rollNumber: outpassData.rollNumber,
    startDateTime: outpassData.startDateTime.toISOString(),
    endDateTime: outpassData.endDateTime.toISOString(),
  });
  
  // Generate QR code as base64
  const qrCodeBase64 = await QRCode.toDataURL(qrData);
  
  return { qrCodeBase64, tokenHash };
};

// Verify QR code data
export const verifyQRCodeData = (qrData: string): { 
  isValid: boolean; 
  decodedData: any | null;
  error?: string;
} => {
  try {
    // Parse the QR data
    const parsedData = JSON.parse(qrData);
    
    // Verify the token
    const decodedToken = jwt.verifyToken(parsedData.token);
    
    if (!decodedToken) {
      return { isValid: false, decodedData: null, error: 'Invalid or expired token' };
    }
    
    // Check if the outpass is currently valid (time-wise)
    const now = new Date();
    const startDateTime = new Date(decodedToken.startDateTime);
    const endDateTime = new Date(decodedToken.endDateTime);
    
    if (now < startDateTime) {
      return { 
        isValid: false, 
        decodedData: decodedToken, 
        error: 'Outpass not yet valid' 
      };
    }
    
    if (now > endDateTime) {
      return { 
        isValid: false, 
        decodedData: decodedToken, 
        error: 'Outpass has expired' 
      };
    }
    
    return { isValid: true, decodedData: decodedToken };
  } catch (error) {
    return { isValid: false, decodedData: null, error: 'Invalid QR code data' };
  }
};

export default {
  generateQRCode,
  verifyQRCodeData,
};