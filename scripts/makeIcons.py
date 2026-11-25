from PIL import Image, ImageDraw, ImageFont
import os
os.makedirs("public", exist_ok=True)
for size in [192, 512]:
    img = Image.new("RGB", (size,size), "#2e7d5b")
    d = ImageDraw.Draw(img)
    # circle
    d.ellipse((size*0.15, size*0.15, size*0.85, size*0.85), fill="#f4f7f5")
    # text A
    try:
        font = ImageFont.truetype("arial.ttf", int(size*0.5))
    except:
        font = ImageFont.load_default()
    d.text((size/2, size/2), "A", fill="#2e7d5b", font=font, anchor="mm")
    img.save(f"public/icon-{size}.png")
    print("saved", size)
# favicon
img = Image.new("RGB", (64,64), "#2e7d5b")
d = ImageDraw.Draw(img)
d.ellipse((10,10,54,54), fill="#f4f7f5")
img.save("public/favicon.ico")
print("done")
