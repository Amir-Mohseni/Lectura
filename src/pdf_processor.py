from olmocr import process_pdf

# Process the PDF with quantization enabled
markdown_output = process_pdf("lecture.pdf", quantized=True)

# Save the output to a markdown file
with open("output.md", "w", encoding="utf-8") as f:
    f.write(markdown_output)

print("Processing complete. Output saved to output.md")