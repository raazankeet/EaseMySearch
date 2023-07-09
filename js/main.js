var data = []; // Variable to hold the parsed CSV data
var currentData = []; // Variable to hold the currently displayed data

// Handle file selection
function handleFileSelect(event) {
  var file = event.target.files[0];
  var reader = new FileReader();

  reader.onload = function(e) {
    var contents = e.target.result;
    var rows = contents.split('\n');
    var header = rows[0].split(',').map(item => item.trim());

    data = [];
    for (var i = 1; i < rows.length; i++) {
      var row = parseCSVRow(rows[i], header.length);
      if (row.length === header.length && row.some(item => item !== '')) {
        var item = {};
        for (var j = 0; j < header.length; j++) {
          item[header[j].replace(/ /g, '_').toLowerCase()] = row[j];
        }
        data.push(item);
      }
    }

    renderTable(data);
    document.getElementById('fileInputLabel').textContent = file.name; // Set the file name as label text
  };

  reader.readAsText(file);
}

// Parse a CSV row, handling quoted values with commas
function parseCSVRow(row, expectedLength) {
  var result = [];
  var startIndex = 0;
  var inQuote = false;

  for (var i = 0; i < row.length; i++) {
    var char = row[i];

    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      var value = row.slice(startIndex, i).trim();
      result.push(value);
      startIndex = i + 1;
    }
  }

  // Add the last value after the last comma
  var lastValue = row.slice(startIndex).trim();
  result.push(lastValue);

  // If the row has fewer values than expected, pad with empty strings
  while (result.length < expectedLength) {
    result.push('');
  }

  return result;
}

// Render the table
function renderTable(data) {
  var formattedData = data.map((item, index) => {
    var folderPath = item.folder || '';
    var tags = item.tags || '';

    // Handle commas within the tags field by enclosing it in quotes
    if (tags.includes(',')) {
      tags = tags.replace(/^"(.+(?="$))"$/, '$1');
    }

    return {
      ...item,
      folder: folderPath,
      tags: tags
    };
  });

  $('#dataTable').bootstrapTable('destroy').bootstrapTable({
    data: formattedData,
    onPostBody: addFolderClickListeners
  });
}

// Add click listeners to folder names for copying the path
function addFolderClickListeners() {
  var table = $('#dataTable');
  var rows = table.find('tbody tr');

  rows.each(function(index) {
    var folderCell = $(this).find('td:nth-child(2)');
    var folderPath = folderCell.text();

    folderCell.empty().append(createFolderLink(folderPath));
  });
}

// Create folder link with click event to copy the path
function createFolderLink(folderPath) {
  var link = $('<a href="#" class="folder-link"></a>');
  link.text(folderPath);
  link.on('click', function() {
    copyToClipboard(folderPath);
    showNotification('Folder path copied to clipboard!', 'success');
  });

  return link;
}

// Copy folder path to clipboard
function copyToClipboard(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Show toast notification
function showNotification(message, type) {
  var iconClass = type === 'success' ? 'toast-success' : '';

  iziToast.show({
    message: '<span class="material-icons md-24">thumb_up</span> ' + message,
    position: 'bottomRight',
    timeout: 3000,
    progressBarColor: type === 'success' ? '#F74A1F' : '',
    backgroundColor: type === 'success' ? '#83DF05' : '',
    icon: 'none',
    displayMode: 2,
    transitionIn: 'bounceInLeft',
    animateInside: true,
  });
}

// Perform search on table
function searchTable() {
  var searchCommonName = document.getElementById('searchInput').value.toLowerCase();
  var searchTags = document.getElementById('searchTagsInput').value.toLowerCase();
  var searchGlobal = document.getElementById('globalSearchInput').value.toLowerCase();

  var filteredData = data.filter(item => {
    var commonName = item['common_name'] || '';
    var folder = item['folder'] || '';
    var fileName = item['file_name'] || '';
    var tags = item['tags'] || '';

    return (
      commonName.toLowerCase().includes(searchCommonName) &&
      tags.toLowerCase().includes(searchTags) &&
      (
        commonName.toLowerCase().includes(searchGlobal) ||
        folder.toLowerCase().includes(searchGlobal) ||
        fileName.toLowerCase().includes(searchGlobal) ||
        tags.toLowerCase().includes(searchGlobal)
      )
    );
  });

  currentData = filteredData.map((item, index) => ({ ...item }));
  renderTable(currentData);
}

function toggleBackground() {
  var body = document.querySelector('body');
  body.classList.toggle('dark-mode');
}