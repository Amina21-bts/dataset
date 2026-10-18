import os
import io
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image

app = Flask(__name__)
CORS(app)

# Settings
IMG_SIZE = 224
MODEL_PATHS = [
    os.path.join(os.path.dirname(__file__), "lung_cancer_model_new.keras"),
    os.path.join(os.path.dirname(__file__), "best_lung_cancer_model_new.keras"),
    os.path.join(os.path.dirname(__file__), "lung_cancer_model.keras"),
    os.path.join(os.path.dirname(__file__), "chest_xray_lung", "lung_cancer_model_new.keras"),
]

model = None
active_model_path = None

for path in MODEL_PATHS:
    if os.path.exists(path):
        try:
            print(f"Loading Keras model from: {path}...")
            model = tf.keras.models.load_model(path)
            active_model_path = path
            print("Model successfully loaded!")
            break
        except Exception as e:
            print(f"Failed to load {path}: {e}")

if model is None:
    print("WARNING: No model file could be loaded. Predictions will return an error.")


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": active_model_path,
        "timestamp": datetime.datetime.now().isoformat()
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "ML Model is not loaded on server."}), 500

    # Retrieve image from files or raw body
    image_bytes = None
    filename = "uploaded_xray.png"

    if 'file' in request.files:
        uploaded_file = request.files['file']
        filename = uploaded_file.filename or filename
        image_bytes = uploaded_file.read()
    elif 'image' in request.files:
        uploaded_file = request.files['image']
        filename = uploaded_file.filename or filename
        image_bytes = uploaded_file.read()
    else:
        # Check raw binary
        data = request.get_data()
        if data and len(data) > 0:
            image_bytes = data

    if not image_bytes:
        return jsonify({"error": "No image file provided in request. Send multipart/form-data with key 'file'."}), 400

    try:
        # Load and preprocess image
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Make prediction
        raw_pred = float(model.predict(img_array, verbose=0)[0][0])

        # Class mapping from predict_image.py:
        # Cancer = 0 (pred < 0.5)
        # NORMAL = 1 (pred >= 0.5)
        if raw_pred >= 0.5:
            predicted_class = "NORMAL"
            confidence = round(raw_pred * 100, 2)
            risk_level = "Low Risk (Healthy / Normal)"
            message = "No definitive malignancy detected. Lung fields appear clear."
        else:
            predicted_class = "Cancer"
            confidence = round((1.0 - raw_pred) * 100, 2)
            risk_level = "High Risk (Cancer / Malignancy Detected)"
            message = "Potential pulmonary nodule / neoplastic lesion detected. Urgent specialist review recommended."

        return jsonify({
            "success": True,
            "filename": filename,
            "predicted_class": predicted_class,
            "confidence": confidence,
            "raw_score": round(raw_pred, 4),
            "risk_level": risk_level,
            "clinical_notes": message,
            "analyzed_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    except Exception as e:
        return jsonify({"error": f"Failed to analyze image: {str(e)}"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Lung Diagnostic API on http://127.0.0.1:{port}...")
    app.run(host='127.0.0.1', port=port, debug=False)

