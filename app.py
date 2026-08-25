import os
import pythoncom
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from docx2pdf import convert

app = Flask(__name__)

# Konfigurasi Direktori
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # Batas maksimal 50 MB

ALLOWED_EXTENSIONS = {'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_docx_to_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file yang diunggah'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'Nama file tidak boleh kosong'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Format file harus berupa .docx'}), 400

    original_filename = file.filename
    safe_filename = secure_filename(original_filename)
    
    if not safe_filename:
        safe_filename = os.path.basename(original_filename)
        
    base_name = os.path.splitext(safe_filename)[0]
    
    input_docx_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
    output_pdf_filename = f"{base_name}.pdf"
    output_pdf_path = os.path.join(app.config['OUTPUT_FOLDER'], output_pdf_filename)

    try:
        # Simpan file DOCX asli
        file.save(input_docx_path)
        pythoncom.CoInitialize()

        # Proses konversi
        convert(input_docx_path, output_pdf_path)

    except Exception as e:
        return jsonify({'error': f'Gagal mengonversi file: {str(e)}'}), 500
    finally:
        # Bersihkan COM dari memori setelah selesai digunakan
        pythoncom.CoUninitialize()

    if not os.path.exists(output_pdf_path):
        return jsonify({'error': 'Gagal membuat file PDF.'}), 500

    return send_file(
        output_pdf_path,
        as_attachment=True,
        download_name=output_pdf_filename,
        mimetype='application/pdf'
    )

if __name__ == '__main__':
    print("Aplikasi berjalan di http://127.0.0.1:5000")
    app.run(debug=True, port=5000)