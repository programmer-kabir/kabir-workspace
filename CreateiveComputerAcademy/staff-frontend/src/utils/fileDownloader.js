/**
 * Universal safe file downloader:
 * Fetches original high-resolution files directly using the backend download proxy
 * which sends Content-Disposition: attachment with the correct original extension.
 */
export const downloadFile = async (fileUrl, customFileName = null) => {
  if (!fileUrl) return;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  // Clean custom filename
  let fileName = customFileName;
  if (!fileName) {
    const pathPart = fileUrl.split('?')[0];
    fileName = pathPart.substring(pathPart.lastIndexOf('/') + 1) || '';
  }

  // Use backend proxy endpoint which handles original uncompressed lookup and sends Content-Disposition: attachment header
  const proxyUrl = `${API_BASE}api/tasks/download_file.php?url=${encodeURIComponent(fileUrl)}${fileName ? `&filename=${encodeURIComponent(fileName)}` : ''}`;

  const link = document.createElement('a');
  link.href = proxyUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

