/**
 * Sunflower Gallery - Google Apps Script Backend
 * 
 * Handles photo uploads to Google Drive and logs to Google Sheets.
 * Deploy as Web App with "Execute as: Me" and "Who has access: Anyone"
 * 
 * IMPORTANT: After any code changes, create a NEW deployment to get updated URL
 */

// ============================================================
// CONFIGURATION - DO NOT CHANGE THESE IDs
// ============================================================
var DRIVE_FOLDER_ID = '1qIhCQ_IzOx50_ONN5TpNwzeMYX4PW4C7';
var SPREADSHEET_ID = '1rQya-Muw0LPXzPsnruRQ1LO-Nih19LzF-3WANpX-Q98';

// ============================================================
// HTTP HANDLERS
// ============================================================

/**
 * Handles GET requests - Returns all photos from the sheet
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return createJsonResponse({ success: true, data: [] });
    }
    
    // Find column indices from header
    var headers = data[0];
    var timestampIdx = Math.max(0, headers.indexOf('Timestamp'));
    var urlIdx = Math.max(1, headers.indexOf('ImageURL'));
    var captionIdx = Math.max(2, headers.indexOf('Caption'));
    var dateIdx = headers.indexOf('Date');
    if (dateIdx === -1) dateIdx = 3;
    var mimeTypeIdx = headers.indexOf('MimeType');
    if (mimeTypeIdx === -1) mimeTypeIdx = 4;
    
    // Parse rows (skip header)
    var photos = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[urlIdx]) {
        photos.push({
          timestamp: row[timestampIdx] || '',
          url: row[urlIdx],
          caption: row[captionIdx] || '',
          date: row[dateIdx] || row[timestampIdx],
          mimeType: row[mimeTypeIdx] || 'image/jpeg' // Default to image for legacy data
        });
      }
    }
    
    // Sort by date (newest first)
    photos.sort(function(a, b) {
      var dateA = new Date(a.date);
      var dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    return createJsonResponse({ success: true, data: photos });
    
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * Handles POST requests - Uploads image to Drive and logs to Sheet
 * Expected payload (sent as plain text JSON): { base64, type, caption, date }
 */
function doPost(e) {
  try {
    // Parse the request body - sent as plain text to avoid CORS preflight
    var payload = JSON.parse(e.postData.contents);
    var base64 = payload.base64;
    var type = payload.type; // This is the MIME type (e.g., 'image/jpeg', 'video/mp4')
    var caption = payload.caption || '';
    var date = payload.date || '';
    var mimeType = type; // Store the full MIME type
    
    // DEBUG: Log the received MIME type
    Logger.log('Received MIME type from frontend: ' + type);
    Logger.log('Is video: ' + (type && type.indexOf('video/') === 0));
    
    if (!base64 || !type) {
      throw new Error('Missing required fields: base64 and type');
    }
    
    // Clean Base64 string (remove header if present)
    var cleanBase64 = base64.split(',')[1] || base64;
    
    // Decode Base64 and create blob
    var decoded = Utilities.base64Decode(cleanBase64);
    var extension = getExtension(type);
    var isVideo = type.indexOf('video/') === 0;
    // Use provided filename or generate one
    var fileName = payload.fileName || ((isVideo ? 'video_' : 'photo_') + Date.now() + '.' + extension);
    
    // DEBUG: Log file creation details
    Logger.log('Creating file: ' + fileName + ' with MIME type: ' + type);
    
    // CRITICAL: Use the EXACT mimeType from frontend, not hardcoded!
    var blob = Utilities.newBlob(decoded, type, fileName);
    
    // Save to Drive
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var file = folder.createFile(blob);
    var fileId = file.getId();
    
    // CRITICAL: Set sharing BEFORE generating the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Use THUMBNAIL URL format for images, store file ID for videos
    // For videos, we'll construct the playback URL on the frontend
    var directLink = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
    
    // Open Sheet
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // Ensure headers exist (now includes MimeType column)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'ImageURL', 'Caption', 'Date', 'MimeType']);
    }
    
    // Prepare row data
    var timestamp = new Date().toISOString();
    var memoryDate = date || timestamp.split('T')[0];
    
    // Append row: [Timestamp, ImageURL, Caption, Date, MimeType]
    sheet.appendRow([timestamp, directLink, caption, memoryDate, mimeType]);
    
    return createJsonResponse({ 
      success: true, 
      message: 'Photo uploaded successfully!',
      data: {
        url: directLink,
        timestamp: timestamp,
        caption: caption,
        date: memoryDate,
        mimeType: mimeType
      }
    });
    
  } catch (error) {
    Logger.log('Upload error: ' + error.message);
    return createJsonResponse({ success: false, error: error.message });
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create JSON response (GAS handles CORS for Web Apps deployed as "Anyone")
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType) {
  var types = {
    // Image types
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    // Video types
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'video/ogg': 'ogv',
    'video/3gpp': '3gp'
  };
  return types[mimeType] || (mimeType.indexOf('video/') === 0 ? 'mp4' : 'jpg');
}

/**
 * Test function - Run this to verify setup
 */
function testSetup() {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log('✅ Drive folder accessible: ' + folder.getName());
    
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet accessible: ' + spreadsheet.getName());
    
    Logger.log('🌻 Setup verified! Ready to deploy as Web App.');
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
  }
}

/**
 * Migration: Convert existing URLs to thumbnail format
 * Run this ONCE to fix all existing broken image URLs
 */
function migrateToThumbnailUrls() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var updated = 0;
  
  for (var i = 1; i < data.length; i++) {
    var url = data[i][1];
    if (url && !url.includes('/thumbnail?')) {
      // Extract file ID from various URL formats
      var fileId = null;
      var match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
      
      var fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) fileId = fileMatch[1];
      
      if (fileId) {
        // Update to thumbnail format
        var newUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
        sheet.getRange(i + 1, 2).setValue(newUrl);
        
        // Also fix permissions
        try {
          var file = DriveApp.getFileById(fileId);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (err) {
          Logger.log('Could not update permissions for: ' + fileId);
        }
        
        updated++;
      }
    }
  }
  
  Logger.log('✅ Migrated ' + updated + ' URLs to thumbnail format.');
}

/**
 * Migration: Add Date column to existing data
 */
function migrateAddDateColumn() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return;
  
  var headers = data[0];
  var dateIdx = headers.indexOf('Date');
  
  if (dateIdx === -1) {
    dateIdx = headers.length;
    sheet.getRange(1, dateIdx + 1).setValue('Date');
  }
  
  for (var i = 1; i < data.length; i++) {
    var timestamp = data[i][0];
    if (timestamp && !data[i][dateIdx]) {
      var dateObj = new Date(timestamp);
      var dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.getRange(i + 1, dateIdx + 1).setValue(dateStr);
    }
  }
  
  Logger.log('✅ Added dates to existing rows.');
}
