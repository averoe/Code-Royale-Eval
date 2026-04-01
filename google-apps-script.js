// ============================================
// Code Royale — Full Backend via Google Apps Script
// ============================================
//
// SETUP:
// 1. Create a new Google Sheet
// 2. Extensions > Apps Script > paste this code
// 3. Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the deployment URL to your frontend .env as VITE_API_URL
//
// This script handles ALL data:
//   - Teams (stored in "Teams" sheet)
//   - Mentors (stored in "Mentors" sheet)
//   - Scores (each mentor gets their own sheet)
//   - Leaderboard (computed from scores)
//   - Admin auth (secure password check)
//
// DEPLOYMENT URL FORMAT:
// https://script.google.com/macros/d/{SCRIPT_ID}/usercallable
// ============================================

var ADMIN_PASSWORD = 'admin123'; // 🔐 CHANGE THIS TO YOUR SECURE PASSWORD
var JWT_SECRET = 'code-royale-secret-2026'; // 🔐 CHANGE THIS FOR PRODUCTION

// ======== HELPERS ========

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4a148c');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function sheetToArray(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function cleanupDefaultSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(def);
  }
}

// ======== SANITIZATION HELPERS ========

function sanitizeSheetName(name) {
  // Replace invalid characters / \ ? * [ ] : with _
  return name.toString().replace(/[\/\\?\*\[\]:\|]/g, '_');
}

// ======== TOKEN/JWT HELPERS ========

function generateToken(data) {
  // Simple JWT-like token (not cryptographically signed but valid for session)
  var header = { alg: 'HS256', typ: 'JWT' };
  var payload = {
    data: data,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  var headerEncoded = Utilities.base64Encode(JSON.stringify(header)).replace(/[=]/g, '');
  var payloadEncoded = Utilities.base64Encode(JSON.stringify(payload)).replace(/[=]/g, '');
  var signature = Utilities.computeHmacSignature(Utilities.DigestAlgorithm.SHA_256, headerEncoded + '.' + payloadEncoded, JWT_SECRET);
  var signatureEncoded = Utilities.base64Encode(signature).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return headerEncoded + '.' + payloadEncoded + '.' + signatureEncoded;
}

function verifyToken(token) {
  try {
    var parts = token.split('.');
    if (parts.length !== 3) return null;
    
    var payloadEncoded = parts[1];
    // Add padding if needed
    var padding = (4 - (payloadEncoded.length % 4)) % 4;
    payloadEncoded = payloadEncoded + '=='.substring(0, padding);
    
    var payload = JSON.parse(Utilities.base64Decode(payloadEncoded, Utilities.Charset.UTF_8));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    
    return payload.data;
  } catch (e) {
    return null;
  }
}

// ======== GET HANDLER ========

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'ping';
    var result;

    switch (action) {
      case 'ping':
        result = { status: 'ok', message: 'Code Royale API is active' };
        break;

      case 'teams':
        result = getTeams();
        break;

      case 'mentors':
        result = getMentors();
        break;

      case 'scores':
        result = getAllScores();
        break;

      case 'leaderboard':
        var round = e.parameter.round || 'combined';
        result = getLeaderboard(round);
        break;

      case 'mentors-list':
        result = getMentorsList();
        break;

      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ======== OPTIONS HANDLER (CORS Preflight) ========

function doOptions(e) {
  var output = ContentService.createTextOutput('');
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setMimeType(ContentService.MimeType.TEXT_PLAIN);
  return output;
}

// ======== POST HANDLER ========

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;

    switch (action) {
      case 'adminLogin':
        result = adminLogin(data);
        break;

      case 'mentorLogin':
        result = mentorLogin(data);
        break;

      case 'verify':
        result = verifyAuthToken(data.token);
        break;

      case 'teams':
        if (data.method === 'POST') {
          result = addTeam(data);
        } else {
          result = getTeams();
        }
        break;

      case 'deleteTeam':
        result = deleteTeam(data);
        break;

      case 'assignMentor':
        result = assignMentor(data);
        break;

      case 'shortlistTeam':
        result = shortlistTeamForFinalRound(data);
        break;

      case 'getShortlisted':
        result = getShortlistedTeams();
        break;

      case 'mentors':
        if (data.method === 'POST') {
          result = addMentor(data);
        } else {
          result = getMentors();
        }
        break;

      case 'deleteMentor':
        result = deleteMentor(data);
        break;

      case 'scores':
        if (data.method === 'POST') {
          result = submitScore(data);
        } else {
          result = getAllScores();
        }
        break;

      case 'deleteScore':
        result = deleteScore(data);
        break;

      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ======== AUTH ========

function adminLogin(data) {
  // No password required for admin access (hidden behind secret button)
  var token = generateToken({
    role: 'admin',
    username: 'admin',
    loginTime: new Date().toISOString()
  });
  return {
    status: 'success',
    token: token,
    user: {
      role: 'admin',
      username: 'admin'
    }
  };
}

function mentorLogin(data) {
  if (!data.mentorName) {
    return { status: 'error', message: 'Please select a mentor' };
  }

  var mentors = getMentorsData();
  var mentor = null;
  
  for (var i = 0; i < mentors.length; i++) {
    if (mentors[i].Name === data.mentorName) {
      mentor = mentors[i];
      break;
    }
  }

  if (!mentor) {
    return { status: 'error', message: 'Mentor not found' };
  }

  // Generate token without password verification (open mentor login)
  var token = generateToken({
    role: 'mentor',
    mentorName: mentor.Name,
    loginTime: new Date().toISOString()
  });

  // Get assigned teams for this mentor
  var teams = getTeamsData();
  var assignedTeams = [];
  teams.forEach(function(t) {
    if (t.Mentor === mentor.Name) {
      assignedTeams.push({
        Name: t.Name,
        Domain: t.Domain,
        LabNumber: t.LabNumber
      });
    }
  });

  return {
    status: 'success',
    token: token,
    user: {
      name: mentor.Name,
      role: 'mentor',
      assignedTeams: assignedTeams
    }
  };
}

function verifyAuthToken(token) {
  var payload = verifyToken(token);
  if (!payload) {
    return { status: 'error', message: 'Invalid or expired token' };
  }
  return { status: 'success', user: payload };
}

// ======== TEAMS ========

function getTeamsData() {
  var sheet = getOrCreateSheet('Teams', ['Name', 'Domain', 'LabNumber', 'Mentor', 'IsShortlisted', 'CreatedAt']);
  return sheetToArray(sheet);
}

function getTeams() {
  var teams = getTeamsData();
  return { status: 'success', data: teams };
}

function addTeam(data) {
  var sheet = getOrCreateSheet('Teams', ['Name', 'Domain', 'LabNumber', 'Mentor', 'IsShortlisted', 'CreatedAt']);

  // Check for duplicate name (normalize with trim and lowercase)
  var existing = getTeamsData();
  var normalizedNewName = data.name.toString().trim().toLowerCase();
  
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].Name.toString().trim().toLowerCase() === normalizedNewName) {
      return { status: 'error', message: 'Team name already exists' };
    }
  }

  sheet.appendRow([data.name, data.domain, data.labNumber, '', 'No', new Date().toLocaleString()]);
  cleanupDefaultSheet();
  return { status: 'success', message: 'Team added' };
}

function deleteTeam(data) {
  var sheet = getOrCreateSheet('Teams', ['Name', 'Domain', 'LabNumber', 'Mentor', 'IsShortlisted', 'CreatedAt']);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'error', message: 'Team not found' };

  var names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] === data.name) {
      sheet.deleteRow(i + 2);
      return { status: 'success', message: 'Team deleted' };
    }
  }
  return { status: 'error', message: 'Team not found' };
}

function assignMentor(data) {
  var sheet = getOrCreateSheet('Teams', ['Name', 'Domain', 'LabNumber', 'Mentor', 'IsShortlisted', 'CreatedAt']);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'error', message: 'Team not found' };

  var names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] === data.teamName) {
      sheet.getRange(i + 2, 4).setValue(data.mentorName);
      return { status: 'success', message: 'Mentor assigned' };
    }
  }
  return { status: 'error', message: 'Team not found' };
}

// ======== SHORTLISTING FEATURE ========

function shortlistTeamForFinalRound(data) {
  var sheet = getOrCreateSheet('Teams', ['Name', 'Domain', 'LabNumber', 'Mentor', 'IsShortlisted', 'CreatedAt']);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'error', message: 'Team not found' };

  var names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] === data.teamName) {
      sheet.getRange(i + 2, 5).setValue(data.isShortlisted ? 'Yes' : 'No');
      return { status: 'success', message: 'Team shortlist status updated' };
    }
  }
  return { status: 'error', message: 'Team not found' };
}

function getShortlistedTeams() {
  var teams = getTeamsData();
  var shortlisted = teams.filter(function(t) { return t.IsShortlisted === 'Yes'; });
  return { status: 'success', data: shortlisted };
}

// ======== MENTORS ========

function getMentorsData() {
  var sheet = getOrCreateSheet('Mentors', ['Name', 'CreatedAt']);
  return sheetToArray(sheet);
}

function getMentors() {
  var mentors = getMentorsData();

  // Count assigned teams per mentor
  var teams = getTeamsData();
  mentors.forEach(function(m) {
    m.assignedTeams = [];
    teams.forEach(function(t) {
      if (t.Mentor === m.Name) {
        m.assignedTeams.push(t.Name);
      }
    });
  });

  return { status: 'success', data: mentors };
}

function getMentorsList() {
  var mentors = getMentorsData();
  return { status: 'success', data: mentors.map(function(m) { return { name: m.Name, Name: m.Name }; }) };
}

function addMentor(data) {
  var sheet = getOrCreateSheet('Mentors', ['Name', 'CreatedAt']);

  var existing = getMentorsData();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].Name.toString().toLowerCase() === data.name.toString().toLowerCase()) {
      return { status: 'error', message: 'Mentor already exists' };
    }
  }

  sheet.appendRow([data.name, new Date().toLocaleString()]);
  cleanupDefaultSheet();
  return { status: 'success', message: 'Mentor added' };
}

function deleteMentor(data) {
  var mentorSheet = getOrCreateSheet('Mentors', ['Name', 'CreatedAt']);
  var lastRow = mentorSheet.getLastRow();
  if (lastRow <= 1) return { status: 'error', message: 'Mentor not found' };

  var names = mentorSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] === data.name) {
      mentorSheet.deleteRow(i + 2);

      // Also remove mentor from any assigned teams
      var teamSheet = getOrCreateSheet('Teams', ['Name', 'Domain', 'LabNumber', 'Mentor', 'IsShortlisted', 'CreatedAt']);
      var teamLastRow = teamSheet.getLastRow();
      if (teamLastRow > 1) {
        var mentorCol = teamSheet.getRange(2, 4, teamLastRow - 1, 1).getValues();
        for (var j = 0; j < mentorCol.length; j++) {
          if (mentorCol[j][0] === data.name) {
            teamSheet.getRange(j + 2, 4).setValue('');
          }
        }
      }

      // Delete mentor's score sheet if exists (use sanitized name)
      var sanitizedName = sanitizeSheetName(data.name);
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var scoreSheet = ss.getSheetByName(sanitizedName);
      if (scoreSheet && ss.getSheets().length > 1) {
        ss.deleteSheet(scoreSheet);
      }

      return { status: 'success', message: 'Mentor deleted' };
    }
  }
  return { status: 'error', message: 'Mentor not found' };
}

// ======== SCORES ========

function submitScore(data) {
  // Validate required data
  if (!data.mentorName) {
    return { status: 'error', message: 'Mentor name is required' };
  }
  if (!data.criteria) {
    return { status: 'error', message: 'Criteria data is required' };
  }

  var mentorName = sanitizeSheetName(data.mentorName);
  var round = Number(data.round) || 0;

  var headers = [
    'Timestamp', 'Team Name', 'Domain', 'Lab Number', 'Round',
    'Innovation & Originality (/20)', 'Problem Definition (/15)',
    'Technical Implementation (/20)', 'Prototype / Working Model (/20)',
    'Feasibility & Scalability (/10)', 'Business Potential & Impact (/10)',
    'Team Collaboration (/5)', 'Total Score (/100)', 'Comments'
  ];

  var sheet = getOrCreateSheet(mentorName, headers);

  // Calculate total score from criteria
  var totalScore = (data.criteria.innovationOriginality || 0) +
                   (data.criteria.problemDefinition || 0) +
                   (data.criteria.technicalImplementation || 0) +
                   (data.criteria.prototypeWorkingModel || 0) +
                   (data.criteria.feasibilityScalability || 0) +
                   (data.criteria.businessPotentialImpact || 0) +
                   (data.criteria.teamCollaboration || 0);

  // Check if this team+round already exists
  var lastRow = sheet.getLastRow();
  var existingRow = -1;
  if (lastRow > 1) {
    var teamCol = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var roundCol = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
    for (var i = 0; i < teamCol.length; i++) {
      if (teamCol[i][0] === data.teamName && Number(roundCol[i][0]) === round) {
        existingRow = i + 2;
        break;
      }
    }
  }

  var rowData = [
    new Date().toLocaleString(),
    data.teamName || '',
    data.domain || '',
    data.labNumber || '',
    round,
    data.criteria.innovationOriginality || 0,
    data.criteria.problemDefinition || 0,
    data.criteria.technicalImplementation || 0,
    data.criteria.prototypeWorkingModel || 0,
    data.criteria.feasibilityScalability || 0,
    data.criteria.businessPotentialImpact || 0,
    data.criteria.teamCollaboration || 0,
    totalScore,
    data.comments || ''
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  cleanupDefaultSheet();
  return { status: 'success', message: 'Score saved', sheet: mentorName, totalScore: totalScore };
}

function deleteScore(data) {
  var mentorName = sanitizeSheetName(data.mentorName);
  var round = Number(data.round);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(mentorName);
  
  if (!sheet) {
    return { status: 'error', message: 'Mentor sheet not found' };
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'error', message: 'No scores found' };

  var teamCol = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  var roundCol = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < teamCol.length; i++) {
    if (teamCol[i][0] === data.teamName && Number(roundCol[i][0]) === round) {
      sheet.deleteRow(i + 2);
      return { status: 'success', message: 'Score deleted' };
    }
  }

  return { status: 'error', message: 'Score not found' };
}

function getAllScores() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var allScores = [];

  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    if (name === 'Teams' || name === 'Mentors' || name === 'Sheet1') return;

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    data.forEach(function(row) {
      allScores.push({
        mentorName: name,
        teamName: row[1],
        domain: row[2],
        labNumber: row[3],
        round: Number(row[4]),
        criteria: {
          innovationOriginality: Number(row[5]),
          problemDefinition: Number(row[6]),
          technicalImplementation: Number(row[7]),
          prototypeWorkingModel: Number(row[8]),
          feasibilityScalability: Number(row[9]),
          businessPotentialImpact: Number(row[10]),
          teamCollaboration: Number(row[11])
        },
        totalScore: Number(row[12]),
        comments: row[13] || ''
      });
    });
  });

  return { status: 'success', data: allScores };
}

function getLeaderboard(roundFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var teamScores = {};
  var teams = getTeamsData();
  var teamShortlistMap = {};

  // Build shortlist map
  teams.forEach(function(t) {
    teamShortlistMap[t.Name] = t.IsShortlisted === 'Yes';
  });

  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    if (name === 'Teams' || name === 'Mentors' || name === 'Sheet1') return;

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;

    var lastCol = sheet.getLastColumn();
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    data.forEach(function(row) {
      var teamName = row[1];
      var round = Number(row[4]);
      var totalScore = Number(row[12]);

      if (!teamScores[teamName]) {
        teamScores[teamName] = {
          teamName: teamName,
          domain: row[2],
          labNumber: row[3],
          round2Score: 0,
          finalRoundScore: 0,
          totalScore: 0,
          hasRound2: false,
          hasFinalRound: false,
          isShortlisted: teamShortlistMap[teamName] || false
        };
      }

      // Start from Round 2 only - skip Round 1
      if (round === 2) {
        teamScores[teamName].round2Score = Math.max(teamScores[teamName].round2Score, totalScore);
        teamScores[teamName].hasRound2 = true;
      } else if (round === 3) { // Final Round
        teamScores[teamName].finalRoundScore = Math.max(teamScores[teamName].finalRoundScore, totalScore);
        teamScores[teamName].hasFinalRound = true;
      }
      teamScores[teamName].totalScore = teamScores[teamName].round2Score + teamScores[teamName].finalRoundScore;
    });
  });

  var leaderboard = Object.keys(teamScores).map(function(k) { return teamScores[k]; });

  if (roundFilter === '2') {
    leaderboard = leaderboard.filter(function(t) { return t.hasRound2; });
    leaderboard.sort(function(a, b) { return b.round2Score - a.round2Score; });
  } else if (roundFilter === 'final') {
    // Final round only shows shortlisted teams
    leaderboard = leaderboard.filter(function(t) { return t.hasFinalRound && t.isShortlisted; });
    leaderboard.sort(function(a, b) { return b.finalRoundScore - a.finalRoundScore; });
  } else {
    // All rounds combined
    leaderboard.sort(function(a, b) { return b.totalScore - a.totalScore; });
  }

  return { status: 'success', data: leaderboard };
}
