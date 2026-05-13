#!/usr/bin/env node
require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const ENV_PATH = path.join(__dirname, '..', '.env');
const OWNER_EMAIL = process.env.DRIVE_OWNER_EMAIL || '';

const FOLDER_NAMES = ['Videos', 'ProfilePictures', 'Thumbnails', 'Images'];

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('serviceAccountKey.json not found at', SERVICE_ACCOUNT_PATH);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log('Creating eShort Drive folder structure...');

  const rootFolderId = await findOrCreateFolder(drive, 'eShort', null);
  console.log(`  Root folder "eShort": ${rootFolderId}`);

  const folders = { root: rootFolderId };
  for (const name of FOLDER_NAMES) {
    const folderId = await findOrCreateFolder(drive, name, rootFolderId);
    folders[name.toLowerCase()] = folderId;
    console.log(`  Sub-folder "${name}": ${folderId}`);
  }

  if (OWNER_EMAIL) {
    try {
      await drive.permissions.create({
        fileId: rootFolderId,
        requestBody: { role: 'writer', type: 'user', emailAddress: OWNER_EMAIL },
        sendNotificationEmail: false,
      });
      console.log(`  Shared root folder with ${OWNER_EMAIL}`);
    } catch (err) {
      if (err.code === 400 && err.message.includes('already has access')) {
        console.log(`  ${OWNER_EMAIL} already has access`);
      } else {
        console.warn(`  Warning: Could not share with ${OWNER_EMAIL}:`, err.message);
      }
    }
  }

  updateEnvFile(folders.root);

  const configPath = path.join(__dirname, '..', 'driveConfig.json');
  fs.writeFileSync(configPath, JSON.stringify(folders, null, 2));
  console.log(`\nDrive folder config saved to ${configPath}`);

  console.log('\nFolder IDs:');
  console.log(JSON.stringify(folders, null, 2));
  console.log('\nDrive setup complete!');
}

async function findOrCreateFolder(drive, name, parentId) {
  const q = parentId
    ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const existing = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  if (existing.data.files.length > 0) return existing.data.files[0].id;

  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  };
  const folder = await drive.files.create({ requestBody: metadata, fields: 'id' });
  return folder.data.id;
}

function updateEnvFile(rootFolderId) {
  if (!fs.existsSync(ENV_PATH)) return;
  let content = fs.readFileSync(ENV_PATH, 'utf-8');
  content = content.replace(
    /GOOGLE_DRIVE_FOLDER_ID=.*/,
    `GOOGLE_DRIVE_FOLDER_ID=${rootFolderId}`
  );
  fs.writeFileSync(ENV_PATH, content);
  console.log(`  Updated GOOGLE_DRIVE_FOLDER_ID in .env`);
}

main().catch((err) => {
  console.error('Drive setup failed:', err.message);
  process.exit(1);
});
