// Download All Final Policies as PDF
async function downloadAllPolicies() {
  // Get all FINAL policies
  const finalPolicies = policies.filter(p => p.status === 'final');
  
  if (finalPolicies.length === 0) {
    alert('No final policies to export. Please mark at least one policy as "Final" before downloading.');
    return;
  }
  
  // Show loading indicator
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:40px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:99999;text-align:center';
  loadingMsg.innerHTML = `
    <div style="font-size:48px;margin-bottom:16px">📄</div>
    <div style="font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Generating PDF...</div>
    <div style="font-size:13px;color:#888">This may take a moment</div>
  `;
  document.body.appendChild(loadingMsg);
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter'); // 8.5" x 11" US Letter
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageWidth - (margin * 2);
    
    // ===== COVER PAGE =====
    doc.setFillColor(26, 26, 26); // #1a1a1a
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Gold accent bar at top
    doc.setFillColor(184, 150, 12); // #B8960C gold
    doc.rect(0, 0, pageWidth, 8, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('LISTING SPECIALIST', pageWidth / 2, 80, { align: 'center' });
    doc.text('HAT PACK', pageWidth / 2, 100, { align: 'center' });
    
    // Divider line
    doc.setDrawColor(184, 150, 12);
    doc.setLineWidth(0.5);
    doc.line(margin, 110, pageWidth - margin, 110);
    
    // Company name
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(184, 150, 12);
    doc.text('The BLK Group at LPT Realty', pageWidth / 2, 130, { align: 'center' });
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    const today = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    doc.text(today, pageWidth / 2, 145, { align: 'center' });
    
    // Policy count
    doc.setFontSize(13);
    doc.setTextColor(200, 200, 200);
    doc.text(`${finalPolicies.length} Policy Letter${finalPolicies.length !== 1 ? 's' : ''}`, pageWidth / 2, 165, { align: 'center' });
    
    // Gold bottom accent
    doc.setFillColor(184, 150, 12);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    
    // ===== POLICY PAGES =====
    for (let i = 0; i < finalPolicies.length; i++) {
      const policy = finalPolicies[i];
      
      // New page for each policy
      doc.addPage();
      
      // Header with BLK Group branding
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(184, 150, 12);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('THE BLK GROUP AT LPT REALTY', margin, 12);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('LISTING SPECIALIST POLICY LETTER', margin, 18);
      
      // Policy title
      doc.setTextColor(26, 26, 26);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const titleLines = doc.splitTextToSize(policy.title || 'Untitled Policy', contentWidth);
      doc.text(titleLines, margin, 40);
      
      // Divider
      doc.setDrawColor(184, 150, 12);
      doc.setLineWidth(0.3);
      const titleHeight = titleLines.length * 7;
      doc.line(margin, 40 + titleHeight + 3, pageWidth - margin, 40 + titleHeight + 3);
      
      // Policy content
      let yPosition = 40 + titleHeight + 12;
      
      // Convert HTML to plain text (strip tags for PDF)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = policy.content;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50, 50, 50);
      
      const contentLines = doc.splitTextToSize(plainText, contentWidth);
      
      for (let j = 0; j < contentLines.length; j++) {
        if (yPosition > pageHeight - margin - 15) {
          // Add new page if content exceeds current page
          doc.addPage();
          yPosition = margin;
          
          // Repeat header on new pages
          doc.setFillColor(26, 26, 26);
          doc.rect(0, 0, pageWidth, 15, 'F');
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text(policy.title + ' (continued)', margin, 10);
          
          yPosition = 25;
          doc.setTextColor(50, 50, 50);
          doc.setFontSize(10);
        }
        
        doc.text(contentLines[j], margin, yPosition);
        yPosition += 5;
      }
      
      // Footer with page number
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Policy ${i + 1} of ${finalPolicies.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Save PDF
    const filename = `BLK-Group-Policy-Letters-${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
    
    // Remove loading indicator
    document.body.removeChild(loadingMsg);
    
    // Success message
    setTimeout(() => {
      alert(`✓ PDF generated successfully!\n\n${finalPolicies.length} policy letter${finalPolicies.length !== 1 ? 's' : ''} exported.\n\nFile: ${filename}`);
    }, 300);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    document.body.removeChild(loadingMsg);
    alert('Error generating PDF: ' + error.message);
  }
}
