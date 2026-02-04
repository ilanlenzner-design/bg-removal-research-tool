// BG Compare Pro - Google Apps Script Backend (Column-Based Storage)
// Deploy as Web App and set execution to "Anyone"

// Configuration
const SHEET_NAME = 'TestData';
const SPREADSHEET_ID = '1znWGVjqtzwaDUTYk07d1AmCT1alZrEMuUOQLsllfJqI';

// Main handlers
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function doPut(e) {
  return handleRequest(e, 'PUT');
}

function doDelete(e) {
  return handleRequest(e, 'DELETE');
}

function handleRequest(e, method) {
  try {
    const path = e.parameter.path || '';

    // Route requests
    if (path === 'tests') {
      if (method === 'GET') {
        return getTests();
      } else if (method === 'POST') {
        return createTest(e);
      }
    } else if (path.startsWith('tests/')) {
      const testId = path.split('/')[1];
      if (testId === 'stats') {
        return getStats();
      } else if (method === 'PUT') {
        return updateTest(e, testId);
      } else if (method === 'DELETE') {
        return deleteTest(testId);
      }
    } else if (path === 'config') {
      return getConfig();
    } else if (path === 'analyze-image') {
      return analyzeImage(e);
    } else if (path === 'score-all-results') {
      return scoreAllResults(e);
    } else if (path === 'score-result') {
      return scoreResult(e);
    }

    return createResponse({ error: 'Not found' }, 404);
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// Database functions
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Initialize headers with separate columns
    sheet.appendRow(['ID', 'Timestamp', 'Category', 'Name', 'Notes', 'Image Analysis', 'Scores (JSON)', 'Results (JSON)']);
    // Format header row
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }

  return sheet;
}

function getTests() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return createResponse([]);
  }

  const tests = [];
  for (let i = 1; i < data.length; i++) {
    try {
      tests.push({
        id: data[i][0],
        timestamp: data[i][1],
        category: data[i][2] || '',
        name: data[i][3] || '',
        notes: data[i][4] || '',
        imageAnalysis: data[i][5] || '',
        scores: data[i][6] ? JSON.parse(data[i][6]) : {},
        results: data[i][7] ? JSON.parse(data[i][7]) : {}
      });
    } catch (e) {
      Logger.log('Error parsing row ' + i + ': ' + e.toString());
    }
  }

  // Sort by timestamp descending (newest first)
  tests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return createResponse(tests);
}

function createTest(e) {
  const sheet = getSheet();
  const testData = JSON.parse(e.postData.contents);

  const id = Date.now().toString();
  const timestamp = new Date().toISOString();

  sheet.appendRow([
    id,
    timestamp,
    testData.category || '',
    testData.name || '',
    testData.notes || '',
    testData.imageAnalysis || '',
    JSON.stringify(testData.scores || {}),
    JSON.stringify(testData.results || {})
  ]);

  return createResponse({
    id: id,
    timestamp: timestamp,
    ...testData
  });
}

function updateTest(e, testId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const updates = JSON.parse(e.postData.contents);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === testId) {
      // Get existing data
      const existing = {
        category: data[i][2],
        name: data[i][3],
        notes: data[i][4],
        imageAnalysis: data[i][5],
        scores: JSON.parse(data[i][6] || '{}'),
        results: JSON.parse(data[i][7] || '{}')
      };

      // Merge with updates
      const updated = { ...existing, ...updates };

      // Update the row
      sheet.getRange(i + 1, 3, 1, 6).setValues([[
        updated.category || '',
        updated.name || '',
        updated.notes || '',
        updated.imageAnalysis || '',
        JSON.stringify(updated.scores || {}),
        JSON.stringify(updated.results || {})
      ]]);

      return createResponse({
        id: testId,
        timestamp: data[i][1],
        ...updated
      });
    }
  }

  return createResponse({ error: 'Test not found' }, 404);
}

function deleteTest(testId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === testId) {
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }

  return createResponse({ error: 'Test not found' }, 404);
}

function getStats() {
  const tests = JSON.parse(getTests().getContent());

  const stats = {
    totalTests: tests.length,
    byCategory: {},
    avgScores: {}
  };

  // Count by category
  tests.forEach(test => {
    if (test.category) {
      stats.byCategory[test.category] = (stats.byCategory[test.category] || 0) + 1;
    }
  });

  // Calculate average scores per model
  const modelScores = {};
  tests.forEach(test => {
    if (test.scores) {
      Object.keys(test.scores).forEach(modelId => {
        if (!modelScores[modelId]) {
          modelScores[modelId] = [];
        }
        const score = test.scores[modelId];
        if (score && score.overall) {
          modelScores[modelId].push(score.overall);
        }
      });
    }
  });

  Object.keys(modelScores).forEach(modelId => {
    const scores = modelScores[modelId];
    stats.avgScores[modelId] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  return createResponse(stats);
}

// Replicate API proxy functions
function getConfig() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('REPLICATE_API_KEY');
  return createResponse({
    apiKey: apiKey,
    hasServerKey: !!apiKey
  });
}

function analyzeImage(e) {
  const payload = JSON.parse(e.postData.contents);
  const apiKey = payload.replicateApiKey || PropertiesService.getScriptProperties().getProperty('REPLICATE_API_KEY');

  if (!apiKey) {
    return createResponse({ error: 'API key not provided' }, 400);
  }

  const prompt = `Analyze this image for background removal purposes. Provide:

**Subject**: What's the main subject?
**Style**: Photo/cartoon/illustration/3D?
**Background**: Simple/complex/gradient/textured?
**Details**: Hair, fur, transparency, glow effects?
**Challenges**: What makes BG removal difficult?
**Recommended Category**: Portrait/E-commerce/Cartoon/Animals/Complex/Fine-Details/VFX/Transparent/Challenging

Keep under 150 words, be concise and specific.`;

  // Create prediction
  const createOptions = {
    method: 'post',
    headers: {
      'Authorization': 'Token ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
      input: {
        image: payload.imageUrl,
        prompt: prompt,
        max_tokens: 500
      }
    }),
    muteHttpExceptions: true
  };

  const createResponse = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions', createOptions);
  let prediction = JSON.parse(createResponse.getContentText());

  // Poll for result
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    Utilities.sleep(1000);

    const statusOptions = {
      method: 'get',
      headers: {
        'Authorization': 'Token ' + apiKey
      },
      muteHttpExceptions: true
    };

    const statusResponse = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions/' + prediction.id, statusOptions);
    prediction = JSON.parse(statusResponse.getContentText());
  }

  if (prediction.status === 'failed') {
    return createResponse({ error: 'Analysis failed' }, 500);
  }

  const analysis = Array.isArray(prediction.output) ? prediction.output.join('') : prediction.output;

  return createResponse({ analysis: analysis });
}

function scoreAllResults(e) {
  const payload = JSON.parse(e.postData.contents);
  const apiKey = payload.replicateApiKey || PropertiesService.getScriptProperties().getProperty('REPLICATE_API_KEY');

  if (!apiKey) {
    return createResponse({ error: 'API key not provided' }, 400);
  }

  const results = payload.results;
  const resultsList = Object.entries(results).map(([modelId, url], index) =>
    `Result ${index + 1} (${modelId}): ${url}`
  ).join('\n');

  const prompt = `You are comparing ${Object.keys(results).length} background removal results side-by-side. RANK them from best to worst.

${resultsList}

Examine ALL results carefully and COMPARE them:
- Which has the cleanest edges?
- Which preserves the most detail?
- Which has the best transparency?

IMPORTANT: Give DIFFERENT scores based on quality ranking:
- Best result: 9-10 for each metric
- Second best: 7-8
- Third: 6-7
- Fourth: 5-6
- Worst: 3-5

For EACH result (1-${Object.keys(results).length}), provide scores:
Result 1 - Edge: X, Detail: Y, Transparency: Z
Result 2 - Edge: X, Detail: Y, Transparency: Z
(continue for all results)`;

  // Create prediction
  const createOptions = {
    method: 'post',
    headers: {
      'Authorization': 'Token ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
      input: {
        image: Object.values(results)[0],
        prompt: prompt,
        max_tokens: 300
      }
    }),
    muteHttpExceptions: true
  };

  const createResp = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions', createOptions);
  let prediction = JSON.parse(createResp.getContentText());

  // Poll for result
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    Utilities.sleep(1000);

    const statusOptions = {
      method: 'get',
      headers: {
        'Authorization': 'Token ' + apiKey
      },
      muteHttpExceptions: true
    };

    const statusResp = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions/' + prediction.id, statusOptions);
    prediction = JSON.parse(statusResp.getContentText());
  }

  if (prediction.status === 'failed') {
    return createResponse({ error: 'Scoring failed' }, 500);
  }

  const responseText = Array.isArray(prediction.output) ? prediction.output.join('') : prediction.output;

  // Parse scores
  const modelIds = Object.keys(results);
  const allScores = {};

  modelIds.forEach((modelId, index) => {
    const resultNum = index + 1;
    const pattern = new RegExp('Result\\s*' + resultNum + '[\\s\\S]{0,50}Edge[:\\s]+(\\d+)[\\s\\S]{0,30}Detail[:\\s]+(\\d+)[\\s\\S]{0,30}Transparency[:\\s]+(\\d+)', 'i');
    const match = responseText.match(pattern);

    if (match) {
      allScores[modelId] = {
        edgeAccuracy: parseInt(match[1]),
        detailPreservation: parseInt(match[2]),
        transparency: parseInt(match[3])
      };
    } else {
      allScores[modelId] = {
        edgeAccuracy: 8 - index,
        detailPreservation: 8 - index,
        transparency: 8 - index
      };
    }
  });

  return createResponse({ scores: allScores });
}

function scoreResult(e) {
  const payload = JSON.parse(e.postData.contents);
  const apiKey = payload.replicateApiKey || PropertiesService.getScriptProperties().getProperty('REPLICATE_API_KEY');

  if (!apiKey) {
    return createResponse({ error: 'API key not provided' }, 400);
  }

  const prompt = `You are an EXTREMELY CRITICAL professional image quality inspector. BE HARSH. BE JUDGMENTAL. USE THE FULL 1-10 RANGE.

Respond with ONLY three numbers, one per line:
Edge: [number 1-10]
Detail: [number 1-10]
Transparency: [number 1-10]`;

  // Create prediction
  const createOptions = {
    method: 'post',
    headers: {
      'Authorization': 'Token ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
      input: {
        image: payload.resultUrl,
        prompt: prompt,
        max_tokens: 100
      }
    }),
    muteHttpExceptions: true
  };

  const createResp = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions', createOptions);
  let prediction = JSON.parse(createResp.getContentText());

  // Poll for result
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    Utilities.sleep(1000);

    const statusOptions = {
      method: 'get',
      headers: {
        'Authorization': 'Token ' + apiKey
      },
      muteHttpExceptions: true
    };

    const statusResp = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions/' + prediction.id, statusOptions);
    prediction = JSON.parse(statusResp.getContentText());
  }

  if (prediction.status === 'failed') {
    return createResponse({ error: 'Scoring failed' }, 500);
  }

  const responseText = Array.isArray(prediction.output) ? prediction.output.join('') : prediction.output;

  // Parse scores
  const edgeMatch = responseText.match(/Edge[:\s]+(\d+)/i);
  const detailMatch = responseText.match(/Detail[:\s]+(\d+)/i);
  const transparencyMatch = responseText.match(/Transparency[:\s]+(\d+)/i);

  const scores = {
    edgeAccuracy: edgeMatch ? parseInt(edgeMatch[1]) : 7,
    detailPreservation: detailMatch ? parseInt(detailMatch[1]) : 7,
    transparency: transparencyMatch ? parseInt(transparencyMatch[1]) : 7
  };

  return createResponse({ scores: scores });
}

// Helper function to create JSON response
function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
