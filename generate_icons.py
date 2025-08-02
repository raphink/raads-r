#!/usr/bin/env python3
"""
Icon Generator for RAADS-R PWA
Generates all required icon sizes from a source SVG or PNG image.

Usage:
  python3 generate_icons.py [source_image]

If no source image is provided, creates a simple default icon.
"""

import os
from PIL import Image, ImageDraw, ImageFont
import argparse

# Required icon sizes for PWA
ICON_SIZES = [
    16, 32, 36, 48, 72, 96, 128, 144, 152, 192, 384, 512
]

def create_default_icon(size):
    """Create a default RAADS-R icon if no source image provided."""
    # Create a circular icon with gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gradient background (blue to darker blue)
    center = size // 2
    radius = center - 4
    
    # Draw circle with blue gradient effect
    for i in range(radius, 0, -1):
        alpha = int(255 * (i / radius))
        color_intensity = int(13 + (110 * (1 - i / radius)))  # From #0d6efd
        color = (color_intensity, 110, 253, alpha)
        draw.ellipse([center - i, center - i, center + i, center + i], fill=color)
    
    # Add text if icon is large enough
    if size >= 72:
        try:
            # Try to use a system font
            font_size = max(size // 8, 12)
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
        
        # Add "R" text in center
        text = "R"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        text_x = (size - text_width) // 2
        text_y = (size - text_height) // 2
        
        # Add text shadow
        draw.text((text_x + 1, text_y + 1), text, fill=(0, 0, 0, 128), font=font)
        # Add main text
        draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    return img

def resize_image(source_path, size):
    """Resize an existing image to the specified size."""
    with Image.open(source_path) as img:
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Resize with high-quality resampling
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        return resized

def generate_icons(source_path=None):
    """Generate all required PWA icons."""
    # Create icons directory if it doesn't exist
    icons_dir = 'icons'
    os.makedirs(icons_dir, exist_ok=True)
    
    print(f"Generating PWA icons in '{icons_dir}' directory...")
    
    for size in ICON_SIZES:
        if source_path and os.path.exists(source_path):
            print(f"  Generating {size}x{size} from {source_path}")
            icon = resize_image(source_path, size)
        else:
            print(f"  Generating default {size}x{size} icon")
            icon = create_default_icon(size)
        
        # Save the icon
        filename = f"icon-{size}x{size}.png"
        filepath = os.path.join(icons_dir, filename)
        icon.save(filepath, 'PNG', optimize=True)
        
        print(f"    Saved: {filepath}")
    
    # Also create favicon.ico (for browsers)
    print("  Generating favicon.ico")
    if source_path and os.path.exists(source_path):
        favicon = resize_image(source_path, 32)
    else:
        favicon = create_default_icon(32)
    
    favicon.save('favicon.ico', 'ICO')
    print("    Saved: favicon.ico")
    
    print(f"\n✅ Successfully generated {len(ICON_SIZES)} icons + favicon!")
    print("\nGenerated files:")
    for size in ICON_SIZES:
        print(f"  - icons/icon-{size}x{size}.png")
    print("  - favicon.ico")

def main():
    parser = argparse.ArgumentParser(description='Generate PWA icons for RAADS-R app')
    parser.add_argument('source', nargs='?', help='Source image file (SVG or PNG)')
    parser.add_argument('--list-sizes', action='store_true', help='List required icon sizes')
    
    args = parser.parse_args()
    
    if args.list_sizes:
        print("Required PWA icon sizes:")
        for size in ICON_SIZES:
            print(f"  - {size}x{size}")
        return
    
    if args.source and not os.path.exists(args.source):
        print(f"❌ Error: Source file '{args.source}' not found")
        return
    
    try:
        generate_icons(args.source)
    except ImportError:
        print("❌ Error: PIL (Pillow) library required")
        print("Install with: pip3 install Pillow")
    except Exception as e:
        print(f"❌ Error generating icons: {e}")

if __name__ == '__main__':
    main()
