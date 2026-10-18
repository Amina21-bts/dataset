
import os
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf

from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# ============================================================
# 1. SETTINGS
# ============================================================

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

train_dir = "chest_xray_lung/train"
val_dir = "chest_xray_lung/val"
test_dir = "chest_xray_lung/test"

# ============================================================
# 2. CHECK DATASET PATHS
# ============================================================

print("\nChecking dataset folders...")

for folder in [train_dir, val_dir, test_dir]:
    if not os.path.isdir(folder):
        raise FileNotFoundError(
            f"Folder not found: {folder}\n"
            "Please run the script from the archive folder."
        )

print("Dataset folders found successfully!")

# ============================================================
# 3. DATA GENERATORS
# ============================================================

train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    horizontal_flip=True
)

test_datagen = ImageDataGenerator(
    rescale=1.0 / 255
)

train_data = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=True
)

val_data = test_datagen.flow_from_directory(
    val_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)

test_data = test_datagen.flow_from_directory(
    test_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)

# ============================================================
# 4. DATASET INFORMATION
# ============================================================

print("\n========== DATASET INFORMATION ==========")

print("Training images   :", train_data.samples)
print("Validation images :", val_data.samples)
print("Test images       :", test_data.samples)
print("Class mapping     :", train_data.class_indices)

# Ensure class folders match across datasets
if train_data.class_indices != val_data.class_indices:
    raise ValueError("Training and validation class mappings differ.")

if train_data.class_indices != test_data.class_indices:
    raise ValueError("Training and test class mappings differ.")

# ============================================================
# 5. CREATE MOBILENETV2 MODEL
# ============================================================

print("\nCreating MobileNetV2 model...")

base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.5),
    layers.Dense(1, activation="sigmoid")
])

# ============================================================
# 6. COMPILE MODEL
# ============================================================

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ============================================================
# 7. CALLBACKS
# ============================================================

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)

checkpoint = ModelCheckpoint(
    "best_lung_cancer_model_new.keras",
    monitor="val_accuracy",
    save_best_only=True,
    mode="max"
)

# ============================================================
# 8. TRAIN MODEL
# ============================================================

print("\n========== STARTING TRAINING ==========")

history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS,
    callbacks=[early_stopping, checkpoint]
)

# ============================================================
# 9. SAVE TRAINING HISTORY
# ============================================================

history_df = pd.DataFrame(history.history)
history_df.to_csv("training_history.csv", index=False)

print("\nTraining history saved to training_history.csv")

# ============================================================
# 10. SAVE FINAL MODEL
# ============================================================

model.save("lung_cancer_model_new.keras")

print("New final model saved successfully!")

# ============================================================
# 11. ACCURACY GRAPH
# ============================================================

plt.figure(figsize=(8, 5))

plt.plot(
    history.history["accuracy"],
    label="Training Accuracy"
)

plt.plot(
    history.history["val_accuracy"],
    label="Validation Accuracy"
)

plt.title("Training and Validation Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(True)
plt.tight_layout()

plt.savefig("accuracy_graph.png")
plt.show()
plt.close()

print("Accuracy graph saved!")

# ============================================================
# 12. LOSS GRAPH
# ============================================================

plt.figure(figsize=(8, 5))

plt.plot(
    history.history["loss"],
    label="Training Loss"
)

plt.plot(
    history.history["val_loss"],
    label="Validation Loss"
)

plt.title("Training and Validation Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)
plt.tight_layout()

plt.savefig("loss_graph.png")
plt.show()
plt.close()

print("Loss graph saved!")

# ============================================================
# 13. EVALUATE MODEL ON TEST DATA
# ============================================================

print("\n========== TESTING MODEL ==========")

test_loss, test_accuracy = model.evaluate(test_data)

print(f"\nTest Loss     : {test_loss:.4f}")
print(f"Test Accuracy : {test_accuracy * 100:.2f}%")

# ============================================================
# 14. COMPLETION SUMMARY
# ============================================================

print("\n========== TRAINING COMPLETED ==========")

print("Final model   : lung_cancer_model_new.keras")
print("Best model    : best_lung_cancer_model_new.keras")
print("History file  : training_history.csv")
print("Accuracy plot : accuracy_graph.png")
print("Loss plot     : loss_graph.png")

print("\nClass mapping:")
print(train_data.class_indices)
