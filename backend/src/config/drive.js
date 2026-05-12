const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

let driveService;
let driveAuth;
let folderIds = {};

const FOLDER_NAMES = ['Videos', 'ProfilePictures', 'Thumbnails', 'Images'];

async function initializeDriveService() {
  try {
    const keyPath = path.join(__dirname, '..', '..', 'serviceAccountKey.json');
    let credentials;

    if (fs.existsSync(keyPath)) {
      credentials = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credentials = {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.FIREBASE_PROJECT_ID,
      };
    } else {
      throw new Error('No service account credentials found');
    }

    driveAuth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    driveService = google.drive({ version: 'v3', auth: driveAuth });

    const configPath = path.join(__dirname, '..', '..', 'driveConfig.json');
    if (fs.existsSync(configPath)) {
      folderIds = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      logger.info('Drive folder config loaded from driveConfig.json');
    } else {
      folderIds = await ensureFolderStructure();
      fs.writeFileSync(configPath, JSON.stringify(folderIds, null, 2));
      logger.info('Drive folders created and config saved');
    }

    logger.info('Google Drive service initialized (service account mode)');
  } catch (error) {
    logger.error('Drive initialization error:', error);
    throw error;
  }
}

async function ensureFolderStructure() {
  const rootId = await findOrCreateFolder('eShort', null);
  const ids = { root: rootId };

  for (const name of FOLDER_NAMES) {
    ids[name.toLowerCase()] = await findOrCreateFolder(name, rootId);
  }

  return ids;
}

async function findOrCreateFolder(name, parentId) {
  const q = parentId
    ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const existing = await driveService.files.list({
    q,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (existing.data.files.length > 0) return existing.data.files[0].id;

  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  };

  const folder = await driveService.files.create({
    requestBody: metadata,
    fields: 'id',
  });

  return folder.data.id;
}

function getDriveService() {
  if (!driveService) throw new Error('Drive service not initialized');
  return driveService;
}

function getFolderIds() {
  return folderIds;
}

function getFolderId(type) {
  const map = {
    video: 'videos',
    videos: 'videos',
    profile: 'profilepictures',
    profilepicture: 'profilepictures',
    profilepictures: 'profilepictures',
    thumbnail: 'thumbnails',
    thumbnails: 'thumbnails',
    image: 'images',
    images: 'images',
  };
  const key = map[type.toLowerCase()] || type.toLowerCase();
  return folderIds[key] || folderIds.root;
}

async function uploadFileToDrive(fileStream, metadata, folderType) {
  const folderId = typeof folderType === 'string' && folderType.length > 10
    ? folderType
    : getFolderId(folderType);

  const response = await driveService.files.create({
    requestBody: {
      name: metadata.name,
      parents: [folderId],
      mimeType: metadata.mimeType,
    },
    media: {
      mimeType: metadata.mimeType,
      body: fileStream,
    },
    fields: 'id, name, webViewLink, webContentLink, size',
  });

  await driveService.permissions.create({
    fileId: response.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink,
    directLink: `https://drive.google.com/uc?export=view&id=${response.data.id}`,
    streamLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`,
    size: response.data.size,
  };
}

async function deleteFileFromDrive(fileId) {
  await driveService.files.delete({ fileId });
}

async function getFileMetadata(fileId) {
  const response = await driveService.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink',
  });
  return response.data;
}

module.exports = {
  initializeDriveService,
  getDriveService,
  getFolderIds,
  getFolderId,
  uploadFileToDrive,
  deleteFileFromDrive,
  getFileMetadata,
  ensureFolderStructure,
};
