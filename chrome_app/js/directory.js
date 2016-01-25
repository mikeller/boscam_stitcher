(function() {
  var inputDirectory = document.getElementById('inputDirectory');
  var outputDirectory = document.getElementById('outputDirectory');
  var fileList = document.getElementById('fileList');
  var status = document.getElementById('status');

  var inputDirectoryEntry;
  var outputDirectoryEntry;

  var inputList = [];

  var jobInDirectory;
  var jobList = [];
  var jobOutDirectory;

  function updateStatus() {
    if (inputDirectoryEntry && outputDirectoryEntry) {
	document.getElementById('process').disabled = false;
    } else {
	document.getElementById('process').disabled = true;
    }
  }

  function doChooseInputDirectory() {
    chrome.fileSystem.chooseEntry( {
      type: 'openDirectory'
    }, processInputDirectory);
  }

  function doChooseOutputDirectory() {
    chrome.fileSystem.chooseEntry( {
      type: 'openDirectory'
    }, processOutputDirectory);
  }

  function processInputDirectory(directoryEntry) {
    if (directoryEntry) {
      inputDirectoryEntry = directoryEntry;
      chrome.fileSystem.getDisplayPath(directoryEntry, function(path) {
        jobInDirectory = path;

        inputDirectory.innerText = path;

        status.innerText = status.innerText + 'Set input path to ' + path + '\n';

        readDirectory(directoryEntry);
      });
    }
  }

  function readDirectory(directoryEntry) {
    var directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(processInputFiles,
      function (error) {
        inputDirectoryEntry = undefined;

        status.innerText = status.innerText + 'Listing ' + dirPath + ' failed.' + '\n';
      }
    );

    updateStatus();
  }

  function processInputFiles (entries) {
    inputList.length = 0;
    fileList.innerText = '';
    var minIndex = 10000;
    var maxIndex = -1;
    entries.forEach(function(entry) {
      if (entry.isFile) {
        var inputEntry = {};
        inputEntry.fileEntry = entry;
        var fileIndex = parseInt(entry.name.substring(4, 8), 10);

        if(inputList[fileIndex] !== undefined) {
          status.innerText = status.innerText + 'Error, file with index ' + fileIndex + ' exists multiple times.' + '\n';
          throw 'Duplicate index';
        }
	if (fileIndex < minIndex) {
          minIndex = fileIndex;
        }
        if (fileIndex > maxIndex) {
          maxIndex = fileIndex;
        }

        inputEntry.sequenceIndex = parseInt(entry.name.substring(0, 4), 10);
        inputList[fileIndex] = inputEntry;
      }
    });

    var jobIndex = 0;
    var jobEntry;
    var fragment = document.createDocumentFragment();
    var lastSequenceIndex = -4;
    for (i = minIndex; i <= maxIndex; i++) {
      if (inputList[i] !== undefined) {
        if (inputList[i].sequenceIndex !== lastSequenceIndex + 3) {
          if (jobEntry !== undefined) {
            jobList.push(jobEntry);
          }
          jobEntry = {
            index: jobIndex,
            inputFiles: []
          };

          var li = document.createElement('li');
          li.innerText = '- (' + jobIndex + ')';
          fragment.appendChild(li);

          jobIndex = jobIndex + 1;
        }
        
        jobEntry.inputFiles.push(jobInDirectory + '/' + inputList[i].fileEntry.name);

        var li = document.createElement('li');
        li.innerHTML = ['<span>', inputList[i].fileEntry.name, '</span>'].join('');

        lastSequenceIndex = inputList[i].sequenceIndex;

        fragment.appendChild(li);
      }
    }
    if (jobEntry !== undefined) {
      jobList[jobEntry.index] = jobEntry;
    }

    fileList.appendChild(fragment);
  }
    
  function processOutputDirectory(directoryEntry) {
    if (directoryEntry) {
      outputDirectoryEntry = directoryEntry;
      chrome.fileSystem.getDisplayPath(directoryEntry, function(path) {
        jobOutDirectory = path;
        outputDirectory.innerText = path;
        status.innerText = status.innerText + 'Set output path to ' + path + '\n';
      });

      updateStatus();
    }
  }

  function doProcess() {
    document.getElementById('chooseInputDirectory').disabled = true;
    document.getElementById('chooseOutputDirectory').disabled = true;
    document.getElementById('process').disabled = true;
    
    processJob(0);
  }

  function processJob(index) {
    var port = chrome.runtime.connectNative('ch.042.boscam_stitcher');

      port.onMessage.addListener(function(msg) {
        status.innerText = status.innerText + msg.text + '\n';
	
        if (msg.processingDone) {
          if (jobList[index + 1] !== undefined) {
            processJob(index + 1);
          } else {
            document.getElementById('chooseInputDirectory').disabled = false;
            document.getElementById('chooseOutputDirectory').disabled = false;
          }
        }
      });

      port.onDisconnect.addListener(function() {
        status.innerText = status.innerText + 'Disconnected.\n';
      });

      var job = jobList[index];
      port.postMessage({
        inputs: job.inputFiles,
        output: jobOutDirectory + '/' + job.index + '.avi'
      });
  }

  document.getElementById('chooseInputDirectory').addEventListener('click', doChooseInputDirectory);
  document.getElementById('chooseOutputDirectory').addEventListener('click', doChooseOutputDirectory);
  document.getElementById('process').addEventListener('click', doProcess);
})();

