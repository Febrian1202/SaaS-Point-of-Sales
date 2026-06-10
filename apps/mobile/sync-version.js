import fs from 'fs';
import path from 'path';

const currentDir = import.meta.dirname;
const pkgPath = path.join(currentDir, 'package.json');
const pubspecPath = path.join(currentDir, 'pubspec.yaml');

// 1. Baca versi baru dari package.json
if (!fs.existsSync(pkgPath)) {
	console.error('File package.json tidak ditemukan di apps/mobile!');
	process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const newSemVer = pkg.version;

// 2. Baca file pubspec.yaml
if (!fs.existsSync(pubspecPath)) {
	console.error('File pubspec.yaml tidak ditemukan di apps/mobile!');
	process.exit(1);
}
let pubspec = fs.readFileSync(pubspecPath, 'utf-8');

// 3. Update SemVer dan naikkan build number (+1) menggunakan Regex
let versionUpdated = false;
pubspec = pubspec.replace(/version:\s*([^\n\+]+)\+(\d+)/, (_, currentSemVer, currentBuildNum) => {
	const nextBuildNum = parseInt(currentBuildNum) + 1;
	versionUpdated = true;
	return `version: ${newSemVer}+${nextBuildNum}`;
});

if (!versionUpdated) {
	console.error('Format version di pubspec.yaml tidak valid atau tidak ditemukan!');
	process.exit(1);
}

// 4. Tulis kembali ke pubspec.yaml
fs.writeFileSync(pubspecPath, pubspec);
console.log(`✓ Sinkronisasi Berhasil: pubspec.yaml diperbarui ke ${newSemVer} dengan build number baru.`);
