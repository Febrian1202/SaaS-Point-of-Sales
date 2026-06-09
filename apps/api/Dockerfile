# Pilih image 
FROM oven/bun:1-alpine 

# Pindah ke folder kerja di container docker
WORKDIR /app

# Caching, salin file dependency terlebih dahulu
COPY package.json bun.lock ./

# Install dependencies untuk production
RUN bun install --production

# Copy seluruh isi source code ke dalam container 
COPY . . 

# Beritahu bahwa aplikasi berjalan di port 3000 
EXPOSE 3000

# Perintah untuk menyalakan aplikasi 
CMD ["bun", "run", "start"]
