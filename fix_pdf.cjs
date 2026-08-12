const fs = require('fs');

let code = fs.readFileSync('src/components/student/StudentResultSlip.tsx', 'utf8');

// Change back to min-h-[1123px] to avoid cropping content
code = code.replace(
  /w-\[794px\] h-\[1123px\]/g,
  'w-[794px] min-h-[1123px]'
);

// Rewrite the handleDownload to correctly handle potential overflow (multipage or scaled)
// I will capture the full element without restricting the height in toJpeg.
const newHandleDownload = `const imgData = await toJpeg(element, { 
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: 794,
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
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let position = 0;
      let heightLeft = pdfHeight;
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      // Add subsequent pages if content overflows one A4 page
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      try {`;

// Replace the current toJpeg and image adding block
code = code.replace(
  /const imgData = await toJpeg\(element, \{[\s\S]*?try \{/m,
  newHandleDownload
);

// We need to also check if the heading sizing works well. The user said: "make the company name and transcript name visible upon downloading"
// Maybe the text-4xl was too big and forced text wrapping which caused more height issues?
// "Jirvinho Software World" in text-4xl takes up a lot of space. Let's make it text-3xl instead.
code = code.replace(
  /<h1 className=\{\`font-extrabold text-blue-900 tracking-tight uppercase \$\{isDownloading \? 'text-4xl' : 'text-3xl sm:text-4xl'\}\`\}>Jirvinho Software World<\/h1>/,
  '<h1 className={`font-extrabold text-blue-900 tracking-tight uppercase ${isDownloading ? \'text-3xl\' : \'text-3xl sm:text-4xl\'}`}>Jirvinho Software World</h1>'
);
code = code.replace(
  /<h2 className=\{\`font-extrabold text-gray-800 mb-4 \$\{isDownloading \? 'text-3xl' : 'text-2xl sm:text-3xl'\}\`\}>OFFICIAL STUDENT RESULT SLIP<\/h2>/,
  '<h2 className={`font-extrabold text-gray-800 mb-4 ${isDownloading ? \'text-2xl\' : \'text-2xl sm:text-3xl\'}`}>OFFICIAL STUDENT RESULT SLIP</h2>'
);

fs.writeFileSync('src/components/student/StudentResultSlip.tsx', code);
