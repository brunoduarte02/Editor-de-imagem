(function () {
  'use strict';

  let cropperInstance = null;
  let currentBlob     = null;
  let currentMime     = 'image/jpeg';
  let originalFile    = null;
  let sourceUrl       = null;
  let previewUrl      = null;

  function loadScript(src, onload) {
    if (window.Cropper) { onload(); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { existing.addEventListener('load', onload); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    document.head.appendChild(s);
  }

  function loadLink(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }

  loadLink('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css');
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js', init);

  function init() {
    const root         = document.getElementById('imageFragmentEditor');
    if (!root) return;

    const stepUpload   = root.querySelector('#stepUpload');
    const stepEdit     = root.querySelector('#stepEdit');
    const dropZone     = root.querySelector('#dropZone');
    const fileInput    = root.querySelector('#fileInput');
    const btnSelect    = root.querySelector('#btnSelect');
    const btnReset     = root.querySelector('#btnReset');
    const cropImg      = root.querySelector('#cropImage');
    const fileName     = root.querySelector('#fileName');

    const outWidth     = root.querySelector('#outWidth');
    const outHeight    = root.querySelector('#outHeight');
    const keepRatio    = root.querySelector('#keepRatio');
    const outFormat    = root.querySelector('#outFormat');
    const outQuality   = root.querySelector('#outQuality');
    const qualityVal   = root.querySelector('#qualityVal');
    const qualityField = root.querySelector('#qualityField');
    const outFileName  = root.querySelector('#outFileName');
    const previewInfo  = root.querySelector('#previewInfo');
    const infoSize     = root.querySelector('#infoSize');
    const infoDims     = root.querySelector('#infoDims');

    const btnPreview   = root.querySelector('#btnPreview');
    const btnSave      = root.querySelector('#btnSave');
    const ratioBtns    = root.querySelectorAll('.ife-ratio-btn');

    const modalPreview     = root.querySelector('#modalPreview');
    const modalBackdrop    = root.querySelector('#modalBackdrop');
    const btnCloseModal    = root.querySelector('#btnCloseModal');
    const btnSaveFromModal = root.querySelector('#btnSaveFromModal');
    const previewImg       = root.querySelector('#previewImg');
    const modalInfo        = root.querySelector('#modalInfo');
    const toast            = root.querySelector('#toast');

    function showToast(msg, type = '', duration = 3500) {
      toast.textContent = msg;
      toast.className = `ife-toast show ${type}`;
      clearTimeout(toast._t);
      toast._t = setTimeout(() => { toast.className = 'ife-toast'; }, duration);
    }

    function showStep(step) {
      [stepUpload, stepEdit].forEach(s => s.classList.add('ife-step--hidden'));
      step.classList.remove('ife-step--hidden');
    }

    function formatBytes(bytes) {
      if (bytes < 1024)       return bytes + ' B';
      if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function extensionFromMime(mime) {
      const map = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
      return map[mime] || 'jpg';
    }

    function revoke(url) { if (url) URL.revokeObjectURL(url); }


    btnSelect.addEventListener('click', (e) => {
      e.stopPropagation(); // evita abrir o seletor duas vezes (o clique subiria para o dropZone)
      fileInput.click();
    });
    dropZone.addEventListener('click', (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });

    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) loadFile(f);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) loadFile(fileInput.files[0]);
    });

    function loadFile(file) {
      originalFile = file;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      fileName.textContent  = file.name;
      outFileName.value     = baseName;

      revoke(sourceUrl);
      sourceUrl = URL.createObjectURL(file);
      cropImg.onload = () => {
        initCropper();
        showStep(stepEdit);
      };
      cropImg.src = sourceUrl;
    }


    function initCropper() {
      if (cropperInstance) { cropperInstance.destroy(); }

      cropperInstance = new Cropper(cropImg, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        crop(event) {
          if (!outWidth.value && !outHeight.value) return;
        }
      });
    }

    ratioBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ratioBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ratio = parseFloat(btn.dataset.ratio);
        if (!cropperInstance) return;
        cropperInstance.setAspectRatio(isNaN(ratio) ? NaN : ratio);
      });
    });


    outWidth.addEventListener('input', () => {
      if (!keepRatio.checked || !outWidth.value) return;
      const cd = cropperInstance ? cropperInstance.getCropBoxData() : null;
      if (cd && cd.width) {
        outHeight.value = Math.round(outWidth.value * cd.height / cd.width) || '';
      }
    });
    outHeight.addEventListener('input', () => {
      if (!keepRatio.checked || !outHeight.value) return;
      const cd = cropperInstance ? cropperInstance.getCropBoxData() : null;
      if (cd && cd.height) {
        outWidth.value = Math.round(outHeight.value * cd.width / cd.height) || '';
      }
    });


    outQuality.addEventListener('input', () => { qualityVal.textContent = outQuality.value; });
    outFormat.addEventListener('change', () => {
      qualityField.style.display = outFormat.value === 'image/png' ? 'none' : '';
    });


    function processImage() {
      return new Promise((resolve, reject) => {
        if (!cropperInstance) { reject(new Error('Cropper não inicializado')); return; }

        const mime    = outFormat.value || 'image/jpeg';
        const quality = parseFloat(outQuality.value) / 100;

        const opts = {};
        const w = parseInt(outWidth.value,  10);
        const h = parseInt(outHeight.value, 10);
        if (w > 0) opts.width  = w;
        if (h > 0) opts.height = h;
        opts.imageSmoothingEnabled = true;
        opts.imageSmoothingQuality = 'high';
        if (mime === 'image/jpeg') opts.fillColor = '#fff';

        const canvas = cropperInstance.getCroppedCanvas(opts);
        if (!canvas) { reject(new Error('Falha ao gerar canvas')); return; }

        const clean  = document.createElement('canvas');
        clean.width  = canvas.width;
        clean.height = canvas.height;
        clean.getContext('2d').drawImage(canvas, 0, 0);

        clean.toBlob(blob => {
          if (!blob) { reject(new Error('Falha ao gerar blob')); return; }
          currentBlob = blob;
          // O navegador pode gerar um formato diferente do pedido (ex.: sem suporte a WebP)
          currentMime = blob.type || mime;
          resolve({ blob, width: clean.width, height: clean.height, mime: currentMime });
        }, mime, quality);
      });
    }


    btnPreview.addEventListener('click', async () => {
      try {
        btnPreview.disabled = true;
        const { blob, width, height } = await processImage();
        revoke(previewUrl);
        previewUrl = URL.createObjectURL(blob);
        previewImg.src = previewUrl;
        const info = `${width}×${height}px · ${formatBytes(blob.size)}`;
        modalInfo.textContent = info;
        infoSize.textContent  = formatBytes(blob.size);
        infoDims.textContent  = `${width}×${height}px`;
        modalPreview.classList.remove('ife-step--hidden');
      } catch (err) {
        showToast('Erro ao gerar pré-visualização: ' + err.message, 'error');
      } finally {
        btnPreview.disabled = false;
      }
    });

    modalBackdrop.addEventListener('click', closeModal);
    btnCloseModal.addEventListener('click', closeModal);
    function closeModal() {
      modalPreview.classList.add('ife-step--hidden');
      revoke(previewUrl);
      previewUrl = null;
    }


    async function saveToDocumentsAndMedia() {
      if (!currentBlob) {
        try {
          await processImage();
        } catch (err) {
          showToast('Erro ao processar imagem: ' + err.message, 'error');
          return;
        }
      }

      const ext       = extensionFromMime(currentMime);
      const baseName  = (outFileName.value || 'imagem').trim();
      const fullName  = `${baseName}.${ext}`;

      const siteId = getSiteId();
      if (!siteId) {
        showToast('Não foi possível detectar o Site ID. Verifique o ambiente Liferay.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', new File([currentBlob], fullName, { type: currentMime }));
      formData.append('documentJSON', JSON.stringify({
        title: baseName,
        fileName: fullName
      }));

      const endpoint = `/o/headless-delivery/v1.0/sites/${siteId}/documents`;

      try {
        btnSave.disabled = btnSaveFromModal.disabled = true;
        btnSave.textContent = 'Salvando…';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-CSRF-Token': getCSRFToken()
          },
          body: formData,
          credentials: 'include'
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 120)}`);
        }

        const data = await res.json();
        showToast(`Salvo com sucesso: ${data.title || fullName}`, 'success');
        closeModal();
        currentBlob = null;
      } catch (err) {
        showToast('Erro ao salvar: ' + err.message, 'error');
        console.error('[ImageFragment] Erro ao salvar no D&M:', err);
      } finally {
        btnSave.disabled = btnSaveFromModal.disabled = false;
        btnSave.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar`;
      }
    }

    btnSave.addEventListener('click', async () => {
      try {
        await processImage();
      } catch (e) {
        showToast('Erro ao processar: ' + e.message, 'error'); return;
      }
      saveToDocumentsAndMedia();
    });
    btnSaveFromModal.addEventListener('click', saveToDocumentsAndMedia);


    function getSiteId() {
      if (window.Liferay && Liferay.ThemeDisplay) {
        return Liferay.ThemeDisplay.getSiteGroupId
          ? Liferay.ThemeDisplay.getSiteGroupId()
          : Liferay.ThemeDisplay.getScopeGroupId();
      }
      const meta = document.querySelector('meta[name="siteId"]') ||
                   document.querySelector('meta[name="_com_liferay_journal_web_portlet_JournalPortlet_groupId"]');
      if (meta) return meta.getAttribute('content');
      const match = location.search.match(/[?&]groupId=(\d+)/);
      if (match) return match[1];
      return null;
    }

    function getCSRFToken() {
      if (window.Liferay && Liferay.authToken) return Liferay.authToken;
      const meta = document.querySelector('meta[name="_liferay_auth_token"]') ||
                   document.querySelector('input[name="p_auth"]');
      if (meta) return meta.getAttribute('content') || meta.value;
      return '';
    }


    btnReset.addEventListener('click', () => {
      if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
      cropImg.onload = null;
      cropImg.src = '';
      revoke(sourceUrl);
      sourceUrl = null;
      currentBlob = null;
      originalFile = null;
      fileInput.value = '';
      outWidth.value = outHeight.value = '';
      showStep(stepUpload);
    });
  }

})();
