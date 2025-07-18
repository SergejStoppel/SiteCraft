/**
 * BasePDFDocument - Core PDF document functionality and styling
 * 
 * This module provides the foundational PDF document setup, color schemes,
 * typography, and common utility methods used across all PDF components.
 * It handles document initialization, page management, and shared styling constants.
 */

const PDFDocument = require('pdfkit');
const logger = require('../../utils/logger');
const i18n = require('../../utils/i18n');
const branding = require('../../../shared/branding');
const BrandingUtils = require('../../../shared/branding/utils');

class BasePDFDocument {
  constructor() {
    // Load colors from centralized branding system
    this.primaryColor = BrandingUtils.getColor('primary.500');
    this.secondaryColor = BrandingUtils.getColor('secondary.500');
    this.textColor = BrandingUtils.getColor('neutral.800');
    this.grayColor = BrandingUtils.getColor('neutral.500');
    this.lightGrayColor = BrandingUtils.getColor('neutral.400');
    this.successColor = BrandingUtils.getColor('success.500');
    this.warningColor = BrandingUtils.getColor('warning.500');
    this.errorColor = BrandingUtils.getColor('error.500');
    this.criticalColor = BrandingUtils.getColor('error.600');
    this.seriousColor = '#ea580c'; // Keep specific color for serious violations
    this.backgroundColor = BrandingUtils.getColor('neutral.50');
    this.accentColor = BrandingUtils.getColor('primary.700');
    this.borderColor = BrandingUtils.getColor('neutral.200');
    
    // Store branding configuration
    this.branding = branding;
    this.brandingUtils = BrandingUtils;

    // Typography settings
    this.fonts = {
      title: { size: 18, weight: 'bold' },
      subtitle: { size: 16, weight: 'bold' },
      heading: { size: 14, weight: 'bold' },
      subheading: { size: 12, weight: 'bold' },
      body: { size: 11, weight: 'normal' },
      caption: { size: 10, weight: 'normal' },
      small: { size: 9, weight: 'normal' },
      tiny: { size: 8, weight: 'normal' }
    };

    // Layout constants from branding
    const pdfConfig = BrandingUtils.getPDFConfig();
    this.margins = pdfConfig.margins;

    this.pageWidth = 612; // A4 width in points
    this.pageHeight = 792; // A4 height in points
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;

    // Page tracking
    this.currentPageNumber = 1;
    this.reportData = null;
    this.language = 'en';
  }

  /**
   * Translation helper method
   */
  t(key, language = null, params = {}) {
    const lang = language || this.language || 'en';
    return i18n.t(key, lang, params);
  }

  /**
   * Format date for current language
   */
  formatDate(date, language = null) {
    const lang = language || this.language || 'en';
    return i18n.formatDate(date, lang);
  }

  /**
   * Format number for current language
   */
  formatNumber(number, language = null) {
    const lang = language || this.language || 'en';
    return i18n.formatNumber(number, lang);
  }

  /**
   * Initialize a new PDF document with standard settings
   */
  createDocument(reportData, language = 'en') {
    this.reportData = reportData;
    this.language = language;
    
    const doc = new PDFDocument({
      margin: this.margins.top,
      size: 'A4',
      info: {
        Title: `${this.t('reports:pdf.documentTitle', language)} - ${reportData.url}`,
        Author: this.branding.company.name,
        Subject: this.t('reports:pdf.documentTitle', language),
        Creator: `${this.branding.company.name} Accessibility Analyzer`
      }
    });

    // Initialize page tracking
    this.currentPageNumber = 1;
    
    return doc;
  }

  /**
   * Add a new page and update page tracking
   */
  addPage(doc) {
    doc.addPage();
    this.currentPageNumber++;
    // Only add footer if we have reportData available
    if (this.reportData) {
      this.addFooterToCurrentPage(doc);
    }
    doc.y = this.margins.top;
    return doc;
  }

  /**
   * Add footer to the current page
   */
  addFooterToCurrentPage(doc) {
    const currentY = doc.y;
    
    const reportUrl = this.reportData && this.reportData.url ? this.reportData.url : 'Accessibility Report';
    
    doc.fontSize(this.fonts.tiny.size)
       .fillColor(this.grayColor)
       .text(`${this.branding.company.name} Accessibility Report - ${reportUrl}`, this.margins.left, 750, { width: 400 })
       .text(`Page ${this.currentPageNumber}`, 450, 750, { width: 100, align: 'right' });
    
    // Restore the y position
    doc.y = currentY;
  }

  /**
   * Create a styled section header
   */
  addSectionHeader(doc, title, yPosition = null) {
    if (yPosition !== null) {
      doc.y = yPosition;
    }

    doc.rect(this.margins.left, doc.y, this.contentWidth, 35)
       .fill(this.backgroundColor)
       .stroke(this.borderColor);
    
    doc.fontSize(this.fonts.title.size)
       .fillColor(this.textColor)
       .text(title, this.margins.left + 15, doc.y + 12);
    
    doc.y += 50;
    return doc.y;
  }

  /**
   * Create a styled content box
   */
  addContentBox(doc, x, y, width, height, fillColor = 'white', strokeColor = null) {
    doc.rect(x, y, width, height)
       .fill(fillColor);
    
    if (strokeColor) {
      doc.stroke(strokeColor);
    }
    
    return { x, y, width, height };
  }

  /**
   * Check if we need a new page based on content height
   */
  checkPageBreak(doc, contentHeight, threshold = 650) {
    if (doc.y + contentHeight > threshold) {
      doc.addPage();
      this.currentPageNumber++;
      // Only add footer if we have reportData available
      if (this.reportData) {
        this.addFooterToCurrentPage(doc);
      }
      doc.y = this.margins.top;
      return true;
    }
    return false;
  }

  /**
   * Get color based on score value
   */
  getScoreColor(score) {
    if (score >= 80) return this.successColor;
    if (score >= 60) return this.warningColor;
    return this.errorColor;
  }

  /**
   * Get color based on impact level
   */
  getImpactColor(impact) {
    const colors = {
      critical: this.criticalColor,
      serious: this.seriousColor,
      moderate: this.warningColor,
      minor: this.lightGrayColor
    };
    return colors[impact] || this.grayColor;
  }

  /**
   * Get color based on priority level
   */
  getPriorityColor(priority) {
    const colors = {
      high: this.errorColor,
      medium: this.warningColor,
      low: this.successColor
    };
    return colors[priority] || this.grayColor;
  }

  /**
   * Apply font styling
   */
  applyFont(doc, fontType = 'body') {
    const font = this.fonts[fontType] || this.fonts.body;
    doc.fontSize(font.size);
    return doc;
  }

  /**
   * Add a decorative line
   */
  addDecorativeLine(doc, y = null, color = null) {
    if (y !== null) doc.y = y;
    
    doc.rect(this.margins.left, doc.y, this.contentWidth, 2)
       .fill(color || this.primaryColor);
    
    doc.y += 10;
  }

  /**
   * Get logo path for PDF context
   */
  getLogoPath(type = 'primary', variant = 'light') {
    return this.brandingUtils.getLogoPath(type, variant, 'pdf');
  }

  /**
   * Get company information
   */
  getCompanyInfo() {
    return this.brandingUtils.getCompanyInfo();
  }

  /**
   * Add company logo to document
   */
  addLogo(doc, x = null, y = null, width = 120, height = 40) {
    const logoPath = this.getLogoPath('primary', 'pdf');
    const xPos = x || this.margins.left;
    const yPos = y || doc.y;
    
    try {
      // Check if logo file exists before trying to add it
      const fs = require('fs');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, xPos, yPos, { width, height });
        return { x: xPos, y: yPos, width, height };
      } else {
        // Fallback to text-based logo if image doesn't exist
        doc.fontSize(this.fonts.title.size)
           .fillColor(this.primaryColor)
           .text(this.branding.company.name, xPos, yPos);
        return { x: xPos, y: yPos, width: 150, height: 20 };
      }
    } catch (error) {
      // Fallback to text-based logo on error
      doc.fontSize(this.fonts.title.size)
         .fillColor(this.primaryColor)
         .text(this.branding.company.name, xPos, yPos);
      return { x: xPos, y: yPos, width: 150, height: 20 };
    }
  }

  /**
   * Generate the PDF buffer
   */
  async generateBuffer(doc) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          logger.info('PDF buffer generated successfully', { 
            size: pdfBuffer.length,
            analysisId: this.reportData ? this.reportData.analysisId : 'unknown'
          });
          resolve(pdfBuffer);
        } catch (error) {
          reject(error);
        }
      });
      doc.on('error', reject);
      
      // End the document to start the streaming
      doc.end();
    });
  }
}

module.exports = BasePDFDocument;