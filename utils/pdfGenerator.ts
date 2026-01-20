import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppState, InterestLevel, RolePreference } from '../types';
import { CHECKLIST_DATA } from '../constants';

// Helper to convert array buffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Font definitions to try in order
const FONT_CANDIDATES = [
  { 
    name: 'ZCOOLXiaoWei', 
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf' 
  },
  { 
    name: 'MaShanZheng', 
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/maishan/Ma%20Shan%20Zheng-Regular.ttf' 
  },
  { 
    name: 'NotoSerifSC', 
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notoserifsc/NotoSerifSC-Regular.ttf' 
  }
];

const addChineseFont = async (doc: jsPDF): Promise<string | null> => {
  for (const font of FONT_CANDIDATES) {
    try {
      const response = await fetch(font.url);
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${font.name}: ${response.status}`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      
      if (buffer.byteLength < 10000) {
        console.warn(`File too small for ${font.name}`);
        continue;
      }

      const fontBase64 = arrayBufferToBase64(buffer);
      const filename = `${font.name}.ttf`;
      
      doc.addFileToVFS(filename, fontBase64);
      doc.addFont(filename, font.name, 'normal');
      
      return font.name;
    } catch (error) {
      console.warn(`Error loading ${font.name}:`, error);
      continue;
    }
  }
  alert("Warning: Could not download any Chinese fonts (Network/CDN Error).\nThe PDF will likely contain garbled text.\n\n无法下载中文字体，生成的 PDF 可能会显示乱码。请检查网络。");
  return null;
};

export const generatePDF = async (data: AppState) => {
  const doc = new jsPDF();
  const loadedFontName = await addChineseFont(doc);
  const fontName = loadedFontName || 'helvetica';

  if (loadedFontName) {
    doc.setFont(loadedFontName);
  }

  const colors = {
    red: [220, 38, 38],
    green: [22, 163, 74],
    orange: [217, 119, 6],
    gray: [156, 163, 175],
    dark: [40, 40, 40]
  };
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  const title = "BDSM check list 报告";
  
  if (loadedFontName) {
    doc.setFont(loadedFontName);
  }
  
  doc.text(title, 14, 20); 
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  const labelUser = '昵称';
  const labelPartner = '伴侣';
  const labelDate = '日期';

  doc.text(`${labelUser}: ${data.userName || '_______'}`, 14, 30);
  doc.text(`${labelPartner}: ${data.partnerName || '_______'}`, 80, 30);
  doc.text(`${labelDate}: ${data.date || new Date().toLocaleDateString()}`, 150, 30);

  const tableRows = CHECKLIST_DATA.map(item => {
    const response = data.responses[item.id];
    
    const r = response || { 
      tried: false, 
      rating: 0, 
      interest: null, 
      role: null 
    };

    return [
      item.category,
      item.label,
      r.tried ? '是' : '否',
      r.tried ? r.rating : '-', 
      mapInterestToText(r.interest),
      mapRoleToText(r.role)
    ];
  });

  const headRow = [['类别', '项目', '尝试过', '评分', '意愿程度', '倾向 (提供/接受)']];

  autoTable(doc, {
    head: headRow,
    body: tableRows,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: 20,
      font: fontName,
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: 255,
      fontStyle: 'bold',
      font: fontName,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    theme: 'grid',
    didParseCell: function (data) {
      if (data.section === 'body') {
        const row = data.row.raw as any[];
        
        // Rating highlight
        if (data.column.index === 3) {
          const val = row[3];
          if (typeof val === 'number') {
            if (val <= 2) {
              data.cell.styles.textColor = colors.red as any;
            } else if (val === 3) {
              data.cell.styles.textColor = colors.orange as any;
            } else if (val >= 4) {
              data.cell.styles.textColor = colors.green as any;
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }

        // Interest highlight
        if (data.column.index === 4) {
          const interestText = String(row[4]);
          
          if (interestText.includes('绝对不行')) {
             data.cell.styles.textColor = colors.red as any;
             data.cell.styles.fontStyle = 'bold';
          } else if (interestText.includes('没兴趣')) {
             data.cell.styles.textColor = colors.gray as any;
          } else if (interestText.includes('好奇')) {
             data.cell.styles.textColor = colors.orange as any;
          } else if (interestText.includes('想尝试') || interestText.includes('渴望')) {
             data.cell.styles.textColor = colors.green as any;
             data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const hardLimits = Object.values(data.responses).filter(r => r.interest === 0).length;
  const favorites = Object.values(data.responses).filter(r => r.interest === 5).length;
  
  doc.setFontSize(10);
  doc.setTextColor(40);
  
  doc.text(`统计摘要:`, 14, finalY);
  doc.text(`- 绝对不行 (Hard Limits): ${hardLimits}`, 14, finalY + 6);
  doc.text(`- 非常渴望/爱死了: ${favorites}`, 14, finalY + 12);

  doc.save('bdsm-checklist-report.pdf');
};

function mapInterestToText(level: InterestLevel | null | undefined): string {
  if (level === null || level === undefined) return '-';
  
  switch (level) {
    case 0: return '绝对不行';
    case 1: return '没兴趣';
    case 2: return '中立';
    case 3: return '有点好奇';
    case 4: return '想尝试';
    case 5: return '爱死了';
    default: return '-';
  }
}

function mapRoleToText(role: RolePreference | null | undefined): string {
  if (role === null || role === undefined) return '-';
  
  switch (role) {
    case 'dom': return '提供 (Dom)';
    case 'sub': return '接受 (Sub)';
    case 'switch': return 'Switch';
    case 'none': return 'N/A';
    default: return '-';
  }
}