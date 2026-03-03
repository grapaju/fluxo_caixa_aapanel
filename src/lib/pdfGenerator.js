import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

// Configurações padrão da empresa
export const DEFAULT_COMPANY_INFO = {
  name: 'FluxoCash - Gestão Financeira',
  document: '00.000.000/0001-00',
  address: 'Rua das Empresas, 123 - Centro',
  city: 'São Paulo - SP',
  cep: '01000-000',
  phone: '(11) 9999-9999',
  email: 'contato@fluxocash.com.br',
  website: 'www.fluxocash.com.br',
  pixKey: ''
};

export const getCompanyInfo = () => {
  const savedData = localStorage.getItem('fluxocash_company_info');
  return savedData ? JSON.parse(savedData) : DEFAULT_COMPANY_INFO;
};

export const getCompanyLogo = () => {
  return localStorage.getItem('fluxocash_company_logo');
};

export const generatePDF = async (element, fileName, options = {}) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ...options
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(fileName);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return { success: false, error: error.message };
  }
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date) => {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `FAT-${year}${month}${timestamp}`;
};

export const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `REC-${year}${month}${timestamp}`;
};

// Função para gerar código PIX (formato EMV)
export const generatePixCode = (pixKey, recipientName, city, amount, description) => {
  // Simplificado - Em produção usar biblioteca específica para PIX EMV
  const formatField = (id, value) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  // Campos obrigatórios do PIX
  let pixCode = '000201'; // Payload Format Indicator
  pixCode += '010212'; // Point of Initiation Method
  
  // Merchant Account Information
  const pixKeyFormatted = formatField('01', pixKey);
  pixCode += formatField('26', `0014br.gov.bcb.pix${pixKeyFormatted}`);
  
  pixCode += formatField('52', '0000'); // Merchant Category Code
  pixCode += formatField('53', '986'); // Transaction Currency (BRL)
  
  if (amount && amount > 0) {
    pixCode += formatField('54', amount.toFixed(2));
  }
  
  pixCode += formatField('58', 'BR'); // Country Code
  pixCode += formatField('59', recipientName.slice(0, 25)); // Merchant Name
  pixCode += formatField('60', city.slice(0, 15)); // Merchant City
  
  if (description) {
    pixCode += formatField('62', formatField('05', description.slice(0, 25)));
  }
  
  pixCode += '6304'; // CRC16
  
  // Calcular CRC16 (simplificado)
  const crc = calculateCRC16(pixCode);
  pixCode += crc;
  
  return pixCode;
};

// Função simplificada de CRC16 para PIX
const calculateCRC16 = (data) => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

// Função para gerar QR Code do PIX
export const generatePixQRCode = async (pixKey, recipientName, city, amount, description) => {
  try {
    if (!pixKey) return null;
    
    const pixCode = generatePixCode(pixKey, recipientName, city, amount, description);
    const qrCodeDataURL = await QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    return null;
  }
};