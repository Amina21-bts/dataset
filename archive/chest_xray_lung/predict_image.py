import tensorflow as tf
import numpy as np
import os

# ==============================
# SETTINGS
# ==============================

IMG_SIZE = 224

# Model path
MODEL_PATH = "lung_cancer_model_new.keras"

# Image path
IMAGE_PATH = r"C:\Users\AMEC\Downloads\archive\chest_xray_lung\chest_xray\test\NORMAL\IM-0001-0001.jpeg"


# ==============================
# CHECK FILES
# ==============================

if not os.path.exists(MODEL_PATH):
    print(f"ERROR: Model not found: {MODEL_PATH}")
    print("Make sure lung_cancer_model.keras is in the correct location.")
    exit()

if not os.path.exists(IMAGE_PATH):
    print(f"ERROR: Image not found: {IMAGE_PATH}")
    print("Put your X-ray image in the correct folder and check its name.")
    exit()


# ==============================
# LOAD MODEL
# ==============================

print("Loading model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully!")


# ==============================
# LOAD AND PREPROCESS IMAGE
# ==============================

print("Loading X-ray image...")

img = tf.keras.utils.load_img(
    IMAGE_PATH,
    target_size=(IMG_SIZE, IMG_SIZE)
)

img_array = tf.keras.utils.img_to_array(img)

# Normalize image
img_array = img_array / 255.0

# Add batch dimension
img_array = np.expand_dims(img_array, axis=0)


# ==============================
# MAKE PREDICTION
# ==============================

print("Making prediction...")

prediction = model.predict(img_array, verbose=0)[0][0]

print("\n================================")
print("PREDICTION RESULT")
print("================================")

print(f"Raw prediction value: {prediction:.4f}")

# Class mapping:
# Cancer = 0
# NORMAL = 1

if prediction >= 0.5:
    predicted_class = "NORMAL"
    confidence = prediction * 100
else:
    predicted_class = "Cancer"
    confidence = (1 - prediction) * 100

print(f"\nPredicted Class: {predicted_class}")
print(f"Confidence: {confidence:.2f}%")

print("\n================================")