const { google } = require('googleapis');
const { logger } = require('../utils/logger');

let driveService;
let oAuth2Client;

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const FOLDER_STRUCTURE = {
  root: 'eShort',
  videos: 'eShort/Videos',
  profilePictures: 'eShort/ProfilePictures',
  thumbnails: 'eShort/Thumbnails',
  images: 'eShort/Images',
};

async function initializeDriveService() {
  try {
    oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    driveService = google.drive({ version: 'v3', auth: oAuth2Client });
    logger.info('Google Drive service configured');
  } catch (error) {
    logger.error('Drive initialization error:', error);
    throw error;
  }
}

function getDriveService() {
  if (!driveService) throw new Error('Drive service not initialized');
  return driveService;
}

function getOAuth2Client() {
  if (!oAuth2Client) throw new Error('OAuth2 client not initialized');
  return oAuth2Client;
}

function getAuthUrl(state) {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
}

async function setCredentials(tokens) {
  oAuth2Client.setCredentials(tokens);
}

async function createFolderStructure(authClient) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const rootFolder = await createFolder(drive, FOLDER_STRUCTURE.root, null);
  const folders = {};
  folders.root = rootFolder;

  const subFolders = ['Videos', 'ProfilePictures', 'Thumbnails', 'Images'];
  for (const name of subFolders) {
    folders[name.toLowerCase()] = await createFolder(drive, name, rootFolder);
  }

  return folders;
}

async function createFolder(drive, name, parentId) {
  const query = parentId
    ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const existing = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

async function uploadFileToDrive(authClient, fileStream, metadata, folderId) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const response = await drive.files.create({
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

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
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

async function deleteFileFromDrive(authClient, fileId) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  await drive.files.delete({ fileId });
}

module.exports = {
  initializeDriveService,
  getDriveService,
  getOAuth2Client,
  getAuthUrl,
  setCredentials,
  createFolderStructure,
  uploadFileToDrive,
  deleteFileFromDrive,
  FOLDER_STRUCTURE,
  SCOPES,
};
