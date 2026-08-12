const fs = require('fs');

let code = fs.readFileSync('src/components/student/StudentResultSlip.tsx', 'utf8');

// 1. Fix typography to be large during download
code = code.replace(
  /<h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight uppercase">Jirvinho Software World<\/h1>/,
  '<h1 className={`font-extrabold text-blue-900 tracking-tight uppercase ${isDownloading ? \'text-4xl\' : \'text-3xl sm:text-4xl\'}`}>Jirvinho Software World</h1>'
);

code = code.replace(
  /<p className="text-sm sm:text-base text-gray-500 font-bold tracking-widest uppercase mt-1">Excellence in Education Technology<\/p>/,
  '<p className={`font-bold tracking-widest uppercase mt-1 text-gray-500 ${isDownloading ? \'text-base\' : \'text-sm sm:text-base\'}`}>Excellence in Education Technology</p>'
);

code = code.replace(
  /<h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4">OFFICIAL STUDENT RESULT SLIP<\/h2>/,
  '<h2 className={`font-extrabold text-gray-800 mb-4 ${isDownloading ? \'text-3xl\' : \'text-2xl sm:text-3xl\'}`}>OFFICIAL STUDENT RESULT SLIP</h2>'
);

// 2. Force element dimensions during download to exactly 794x1123
code = code.replace(
  /w-\[794px\] min-h-\[1123px\]/g,
  'w-[794px] h-[1123px]'
);

// 3. Update the handleDownload function to force width/height and stretch image exactly to page
const newHandleDownload = `const imgData = await toJpeg(element, { 
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: 794,
        height: 1123,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Because the image is strictly 794x1123, we can fill the page exactly without layout shifts or margins
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pageHeight);
      
      try {`;

// Replace the old toJpeg and image adding block
code = code.replace(
  /const imgData = await toJpeg\(element, \{[\s\S]*?try \{/m,
  newHandleDownload
);

fs.writeFileSync('src/components/student/StudentResultSlip.tsx', code);
