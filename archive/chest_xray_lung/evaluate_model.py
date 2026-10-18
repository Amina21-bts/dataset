import tensorflow as tf
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# ==============================
# SETTINGS
# ==============================

IMG_SIZE = 224
BATCH_SIZE = 32

# Dataset path
test_dir = "chest_xray_lung/test"

# ==============================
# LOAD TEST DATA
# ==============================

test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
    rescale=1.0 / 255
)

test_data = test_datagen.flow_from_directory(
    test_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)

print("\nClasses:")
print(test_data.class_indices)

# ==============================
# LOAD TRAINED MODEL
# ==============================

print("\nLoading trained model...")

model = tf.keras.models.load_model(
    "lung_cancer_model_new.keras"
)

# ==============================
# EVALUATE MODEL
# ==============================

print("\nEvaluating model...")

loss, accuracy = model.evaluate(test_data)

print("\n================================")
print("MODEL PERFORMANCE")
print("================================")

print(f"Test Loss     : {loss:.4f}")
print(f"Test Accuracy : {accuracy * 100:.2f}%")

# ==============================
# PREDICTIONS
# ==============================

print("\nGenerating predictions...")

predictions = model.predict(test_data)

# Convert probabilities to classes
predicted_classes = (predictions >= 0.5).astype(int).flatten()

true_classes = test_data.classes

# ==============================
# CLASSIFICATION REPORT
# ==============================

print("\n================================")
print("CLASSIFICATION REPORT")
print("================================")

print(
    classification_report(
        true_classes,
        predicted_classes,
        target_names=["Cancer", "NORMAL"]
    )
)

# ==============================
# CONFUSION MATRIX
# ==============================

print("\n================================")
print("CONFUSION MATRIX")
print("================================")

cm = confusion_matrix(
    true_classes,
    predicted_classes
)

print(cm)
# ==============================
# CONFUSION MATRIX GRAPH
# ==============================

import matplotlib.pyplot as plt

plt.figure(figsize=(6, 5))
plt.imshow(cm)

plt.title("Confusion Matrix")
plt.colorbar()

classes = ["Cancer", "NORMAL"]
plt.xticks([0, 1], classes)
plt.yticks([0, 1], classes)

plt.xlabel("Predicted Label")
plt.ylabel("True Label")

for i in range(2):
    for j in range(2):
        plt.text(j, i, cm[i, j],
                 ha="center",
                 va="center")

plt.tight_layout()
plt.savefig("confusion_matrix.png")
plt.show()

print("\nConfusion Matrix graph saved as: confusion_matrix.png")