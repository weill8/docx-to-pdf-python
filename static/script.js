document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const fileCard = document.getElementById('fileCard');
    const fileNameDisplay = document.getElementById('fileName');
    const fileSizeDisplay = document.getElementById('fileSize');
    const btnRemove = document.getElementById('btnRemove');
    const btnConvert = document.getElementById('btnConvert');
    const btnLabel = document.getElementById('btnLabel');
    const btnSpinner = document.getElementById('btnSpinner');
    const uploadForm = document.getElementById('uploadForm');
    const toastContainer = document.getElementById('toastContainer');

    let selectedFile = null;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // Highlighting Dragover
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    // Handle Drop File
    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Handle File Picker Input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension !== 'docx') {
            showToast('Hanya file bertipe .docx yang diperbolehkan!', 'error');
            return;
        }

        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatBytes(file.size);

        dropzoneContent.classList.add('hidden');
        fileCard.classList.remove('hidden');
        btnConvert.disabled = false;
    }

    btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileSelection();
    });

    function resetFileSelection() {
        selectedFile = null;
        fileInput.value = '';
        dropzoneContent.classList.remove('hidden');
        fileCard.classList.add('hidden');
        btnConvert.disabled = true;
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Submit & Async Upload/Convert
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoadingState(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal melakukan konversi.');
            }

            // Unduh Blob PDF
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;

            // Menggunakan nama file asli dengan ekstensi .pdf
            const originalBaseName = selectedFile.name.replace(/\.docx$/i, '');
            const downloadFileName = `${originalBaseName}.pdf`;
            a.download = downloadFileName;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();

            // Notifikasi Sukses
            showToast(`File "${downloadFileName}" berhasil dikonversi dan diunduh!`, 'success');

            resetFileSelection();

        } catch (err) {
            showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(isLoading) {
        if (isLoading) {
            btnConvert.disabled = true;
            btnLabel.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            btnConvert.disabled = selectedFile === null;
            btnLabel.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';

        const iconSvg = type === 'success' 
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-message">${message}</div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
});