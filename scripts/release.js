#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// package.jsonからバージョンを読み取る
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);
const version = `v${packageJson.version}`;

console.log(`Creating release ${version}...`);

try {
  // リリースを作成
  execSync(
    `gh release create ${version} --title "${version}" --generate-notes`,
    { stdio: 'inherit' }
  );

  console.log('Uploading macOS assets...');

  // macOSファイルをアップロード
  const releaseDir = path.join(__dirname, '../release');
  const files = fs.readdirSync(releaseDir);
  const assets = files.filter(f => f.endsWith('.dmg') || f.endsWith('.zip'));

  if (assets.length === 0) {
    console.error('No release files found!');
    process.exit(1);
  }

  assets.forEach(asset => {
    const assetPath = path.join(releaseDir, asset);
    console.log(`Uploading ${asset}...`);
    execSync(`gh release upload ${version} "${assetPath}"`, { stdio: 'inherit' });
  });

  console.log(`\n✅ Release ${version} created successfully!`);
  console.log(`🔗 https://github.com/pepabo/alive-studio-midi-controller/releases/tag/${version}`);
} catch (error) {
  console.error('Release failed:', error.message);
  process.exit(1);
}
