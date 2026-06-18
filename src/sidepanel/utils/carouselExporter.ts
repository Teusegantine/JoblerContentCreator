import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';

/**
 * Captures rendered DOM elements as PNGs, bundles them into a ZIP archive,
 * and triggers a native browser download.
 * 
 * @param slideIds Array of DOM element IDs containing the high-res slides.
 * @param zipFileName The output file name (e.g. 'carrossel_linkedin.zip').
 */
export async function exportCarouselToZip(slideIds: string[], zipFileName: string = 'carrossel.zip'): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < slideIds.length; i++) {
    const element = document.getElementById(slideIds[i]);
    if (!element) {
      throw new Error(`Erro: Elemento com ID '${slideIds[i]}' não foi encontrado no DOM.`);
    }

    // Force style rules for snapshot to ensure rendering matches expectation
    // and looks crisp for high-res downloads (pixelRatio: 2 produces 2x size for retina feel)
    const blob = await htmlToImage.toBlob(element, {
      pixelRatio: 2,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      // Give DOM time to settle styling details
      cacheBust: true,
    });

    if (!blob) {
      throw new Error(`Falha ao converter o slide ${i + 1} em imagem.`);
    }

    // Add PNG to ZIP folder structure
    zip.file(`slide_${i + 1}.png`, blob);
  }

  // Compile files into single archive blob
  const zipContent = await zip.generateAsync({ type: 'blob' });

  // Native browser download trigger
  const downloadUrl = URL.createObjectURL(zipContent);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = zipFileName;
  
  document.body.appendChild(anchor);
  anchor.click();
  
  // Clean up references
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
