import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

interface LabelData {
  sku: string;
  name: string;
  category: string;
  basePrice: number;
  currentDiscount: number;
  expiryDate: string;
}

/**
 * Generates Avery 5160 compatible labels (3 columns x 10 rows per page)
 * Label dimensions: 2.625" x 1" (66.675mm x 25.4mm)
 * Page margins: 0.1875" (4.7625mm) top/bottom, 0.15625" (3.96875mm) left/right
 */
export class LabelGenerator {
  private pdf: jsPDF;
  private readonly LABELS_PER_ROW = 3;
  private readonly LABELS_PER_COL = 10;
  private readonly LABEL_WIDTH = 66.675; // mm
  private readonly LABEL_HEIGHT = 25.4; // mm
  private readonly MARGIN_LEFT = 3.96875; // mm
  private readonly MARGIN_TOP = 4.7625; // mm
  private readonly HORIZONTAL_GAP = 3.175; // mm
  private readonly VERTICAL_GAP = 0; // mm

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
  }

  /**
   * Generate barcode as base64 image
   */
  private generateBarcode(sku: string): string {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, sku, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Barcode generation failed:', error);
      return '';
    }
  }

  /**
   * Calculate position for a label based on index
   */
  private getLabelPosition(index: number): { x: number; y: number } {
    const row = Math.floor(index / this.LABELS_PER_ROW);
    const col = index % this.LABELS_PER_ROW;

    const x = this.MARGIN_LEFT + col * (this.LABEL_WIDTH + this.HORIZONTAL_GAP);
    const y = this.MARGIN_TOP + row * (this.LABEL_HEIGHT + this.VERTICAL_GAP);

    return { x, y };
  }

  /**
   * Draw a single label
   */
  private drawLabel(labelData: LabelData, x: number, y: number): void {
    const discountedPrice = labelData.basePrice * (1 - labelData.currentDiscount / 100);
    
    // Border
    this.pdf.setDrawColor(0);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(x, y, this.LABEL_WIDTH, this.LABEL_HEIGHT);

    // Product Name (truncate if too long)
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    const maxNameWidth = this.LABEL_WIDTH - 4;
    let productName = labelData.name.toUpperCase();
    if (this.pdf.getTextWidth(productName) > maxNameWidth) {
      while (this.pdf.getTextWidth(productName + '...') > maxNameWidth && productName.length > 0) {
        productName = productName.slice(0, -1);
      }
      productName += '...';
    }
    this.pdf.text(productName, x + this.LABEL_WIDTH / 2, y + 4, { align: 'center' });

    // SKU and Category
    this.pdf.setFontSize(6);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100);
    this.pdf.text(`${labelData.sku} | ${labelData.category}`, x + this.LABEL_WIDTH / 2, y + 7, { align: 'center' });

    // Price Section
    const priceY = y + 11;
    
    if (labelData.currentDiscount > 0) {
      // Original Price (strikethrough)
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(150);
      const originalPriceText = `₹${labelData.basePrice.toFixed(2)}`;
      const originalPriceX = x + this.LABEL_WIDTH / 2;
      this.pdf.text(originalPriceText, originalPriceX, priceY, { align: 'center' });
      
      // Strikethrough line
      const textWidth = this.pdf.getTextWidth(originalPriceText);
      this.pdf.setDrawColor(150);
      this.pdf.setLineWidth(0.2);
      this.pdf.line(
        originalPriceX - textWidth / 2,
        priceY - 1,
        originalPriceX + textWidth / 2,
        priceY - 1
      );

      // Discount Badge
      this.pdf.setFillColor(211, 47, 47);
      this.pdf.roundedRect(x + this.LABEL_WIDTH / 2 - 8, priceY + 0.5, 16, 4, 2, 2, 'F');
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(`${labelData.currentDiscount}% OFF`, x + this.LABEL_WIDTH / 2, priceY + 3.5, { align: 'center' });

      // Discounted Price
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(211, 47, 47);
      this.pdf.text(`₹${discountedPrice.toFixed(2)}`, x + this.LABEL_WIDTH / 2, priceY + 8, { align: 'center' });
    } else {
      // Regular Price
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(0);
      this.pdf.text(`₹${labelData.basePrice.toFixed(2)}`, x + this.LABEL_WIDTH / 2, priceY + 4, { align: 'center' });
    }

    // Expiry Date
    this.pdf.setFontSize(6);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100);
    const expiryText = `Best Before: ${new Date(labelData.expiryDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`;
    this.pdf.text(expiryText, x + this.LABEL_WIDTH / 2, y + this.LABEL_HEIGHT - 5, { align: 'center' });

    // Barcode
    const barcodeImage = this.generateBarcode(labelData.sku);
    if (barcodeImage) {
      const barcodeWidth = 30;
      const barcodeHeight = 6;
      this.pdf.addImage(
        barcodeImage,
        'PNG',
        x + (this.LABEL_WIDTH - barcodeWidth) / 2,
        y + this.LABEL_HEIGHT - 3,
        barcodeWidth,
        barcodeHeight
      );
    }
  }

  /**
   * Generate PDF with multiple labels
   */
  public generateLabels(labels: LabelData[]): void {
    labels.forEach((label, index) => {
      // Add new page if needed (after 30 labels)
      if (index > 0 && index % (this.LABELS_PER_ROW * this.LABELS_PER_COL) === 0) {
        this.pdf.addPage();
      }

      const position = this.getLabelPosition(index % (this.LABELS_PER_ROW * this.LABELS_PER_COL));
      this.drawLabel(label, position.x, position.y);
    });
  }

  /**
   * Open PDF in new tab
   */
  public openInNewTab(): void {
    const pdfBlob = this.pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  }

  /**
   * Download PDF
   */
  public download(filename: string = 'price-labels.pdf'): void {
    this.pdf.save(filename);
  }
}

/**
 * Helper function to generate labels for multiple items
 */
export function generatePriceLabels(items: LabelData[], openInNewTab: boolean = true): void {
  const generator = new LabelGenerator();
  generator.generateLabels(items);
  
  if (openInNewTab) {
    generator.openInNewTab();
  } else {
    generator.download(`price-labels-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
