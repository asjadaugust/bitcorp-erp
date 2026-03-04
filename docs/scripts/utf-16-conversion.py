import os
from pathlib import Path


def convert_large_file(input_path, output_path, chunk_size=1024 * 1024):
    """
    Reads a UTF-16 file in chunks and writes it as UTF-8.
    chunk_size is set to 1MB (1024 * 1024 characters) to keep memory usage low.
    """
    try:
        # Note: If 'utf-16' throws an error, try 'utf-16-le' specifically
        with open(input_path, "r", encoding="utf-16") as f_in:
            with open(output_path, "w", encoding="utf-8") as f_out:
                while True:
                    chunk = f_in.read(chunk_size)
                    if not chunk:
                        break
                    f_out.write(chunk)
        print(f"✅ Success: {input_path.name}")
    except Exception as e:
        print(f"❌ Failed to convert {input_path.name}. Error: {e}")


def batch_convert_folder(target_directory):
    """
    Scans a directory for text/data files and converts them,
    saving the safe files into a new subfolder.
    """
    target_dir = Path(target_directory)

    # Create a safe output folder so we don't overwrite your originals
    output_dir = target_dir / "utf8_ready_for_agent"
    output_dir.mkdir(exist_ok=True)

    print(f"Scanning {target_dir} for files to convert...")
    print(f"Outputting to: {output_dir}\n")

    # Add or remove file extensions based on what SQL Server exported
    extensions_to_convert = ["*.txt", "*.csv", "*.sql"]

    files_found = 0
    for ext in extensions_to_convert:
        for file_path in target_dir.glob(ext):
            files_found += 1
            out_path = output_dir / file_path.name
            convert_large_file(file_path, out_path)

    if files_found == 0:
        print("No files matching those extensions were found in the directory.")
    else:
        print("\n🎉 Batch conversion complete!")


# --- Setup and Run ---
if __name__ == "__main__":
    # Pointing this to your project path from the Haiku logs
    PROJECT_DATA_DIR = "/Users/klm95441/Documents/projects/bitcorp-erp/data_files"

    # Update the folder path above to point precisely to where the SQL Server exports are
    batch_convert_folder(PROJECT_DATA_DIR)
