
import os

dataset_path = r"C:\Users\AMEC\Downloads\archive\chest_xray_lung"

total = 0

for split in ["train", "val", "test"]:
    split_path = os.path.join(dataset_path, split)

    print(f"\n===== {split.upper()} =====")
    split_total = 0

    if not os.path.exists(split_path):
        print("Folder not found!")
        continue

    for category in os.listdir(split_path):
        category_path = os.path.join(split_path, category)

        if not os.path.isdir(category_path):
            continue

        count = sum(
            1 for file in os.listdir(category_path)
            if file.lower().endswith(
                (".jpg", ".jpeg", ".png", ".bmp", ".webp")
            )
        )

        print(f"{category}: {count} images")

        split_total += count

    print(f"Total {split}: {split_total}")
    total += split_total

print(f"\nTOTAL DATASET IMAGES: {total}")
