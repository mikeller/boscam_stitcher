(function() {
  var jobIndex;
  var jobInputDirectory;
  var jobList = [];
  var jobOutputDirectory;
  var jobStartIndex;
  var dateString = moment().format("YYYYMMDD");

  function updateStatus() {
    if (jobList.length > 0 && jobOutputDirectory !== undefined) {
	processButton.disabled = false;
    } else {
	processButton.disabled = true;
    }
  }

  function updateProgressBar(index, percent) {
    progressBarField.innerText = percent + ' percent done of file ' + index + ' of ' + jobIndex + '...';
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
      chrome.fileSystem.getDisplayPath(directoryEntry, function(path) {
        jobInputDirectory = path;

        inputDirectoryField.innerText = path;

        statusList.innerText = statusList.innerText + 'Set input path to ' + path + '\n';

        readInputDirectory(directoryEntry);
      });
    }
  }

  function readInputDirectory(directoryEntry) {
    var directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(processInputFiles,
      function (error) {
        statusList.innerText = statusList.innerText + 'Listing ' + dirPath + ' failed.' + '\n';
      }
    );

    updateStatus();
  }

  function processInputFiles(entries) {
    var inputList = [];
    fileList.innerText = '';
    var minIndex = 10000;
    var maxIndex = -1;
    entries.forEach(function(entry) {
      if (entry.isFile) {
        var inputEntry = {};
        inputEntry.fileEntry = entry;
        var fileIndex = parseInt(entry.name.substring(4, 8), 10);

        if(inputList[fileIndex] !== undefined) {
          statusList.innerText = statusList.innerText + 'Error, file with index ' + fileIndex + ' exists multiple times.' + '\n';
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

    jobIndex = 0;
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
        
        jobEntry.inputFiles.push(jobInputDirectory + '/' + inputList[i].fileEntry.name);

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
      chrome.fileSystem.getDisplayPath(directoryEntry, function(path) {
        jobOutputDirectory = path;

        outputDirectoryField.innerText = path;
        statusList.innerText = statusList.innerText + 'Set output path to ' + path + '\n';

        readOutputDirectory(directoryEntry);
      });
    }
  }

  function readOutputDirectory(directoryEntry) {
    var directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(processOutputFiles,
      function (error) {
        statusList.innerText = statusList.innerText + 'Listing ' + dirPath + ' failed.' + '\n';
      }
    );

    updateStatus();
  }

  function getOutputPrefix() {
    return dateString + '_';
  }

  function getOutputSuffix() {
    return '.avi';
  }

  function getPaddedNumber(number) {
    return ('000' + number).substr(-3);
  }

  function processOutputFiles(entries) {
    jobStartIndex = 0;
    entries.forEach(function(entry) {
      if (entry.isFile
        && entry.name.substr(0, getOutputPrefix().length) === getOutputPrefix()
        && entry.name.substr(-getOutputSuffix().length) === getOutputSuffix()) {
        var fileIndex = parseInt(entry.name.substring(getOutputPrefix().length, entry.name.length - getOutputSuffix().length), 10);
        if (fileIndex >= jobStartIndex) {
          jobStartIndex = fileIndex + 1;
        }
      }
    });

    startIndexField.innerText = jobStartIndex;
    statusList.innerText = statusList.innerText + 'Set starting output file index to ' + jobStartIndex + '\n';
  }

  function doProcess() {
    if (jobList.length > 0) {
      inputDirectoryButton.disabled = true;
      outputDirectoryButton.disabled = true;
      processButton.disabled = true;
    
      processJob();
    }
  }

  function processJob() {
    var port = chrome.runtime.connectNative('ch.042.boscam_stitcher');

    port.onMessage.addListener(function(msg) {
      if (msg.text !== undefined) {
        statusList.innerText = statusList.innerText + msg.text + '\n';
      }

      if (msg.progress !== undefined) {
         updateProgressBar(jobIndex - jobList.length, msg.progress.percent);
      }

      if (msg.processingDone) {
        if (!msg.error) {
          progressBarField.innerText = 'Completed processing file ' + (jobIndex - jobList.length) + ' of ' + jobIndex + '.';
        } else {
          progressBarField.innerText = 'An error occurred: ' + msg.text;
        }

        if (jobList.length > 0) {
          processJob();
        } else {
          inputDirectoryButton.disabled = false;
          outputDirectoryButton.disabled = false;
        }
      }
    });

    port.onDisconnect.addListener(function() {
      progressBarField.innerText = 'The server disconnected.';
      statusList.innerText = statusList.innerText + 'Disconnected.\n';
    });

    var job = jobList.splice(0, 1)[0];
    port.postMessage({
      inputs: job.inputFiles,
      output: jobOutputDirectory + '/' + getOutputPrefix() + getPaddedNumber(jobStartIndex + job.index) + getOutputSuffix(),
      outputOptions: ['-c:v libx264', '-preset slower', '-crf 22', '-an']
    });
  }

  function doClear() {
  }

  inputDirectoryButton.addEventListener('click', doChooseInputDirectory);
  outputDirectoryButton.addEventListener('click', doChooseOutputDirectory);
  processButton.addEventListener('click', doProcess);
//  clearButton.addEventListener('click', doClear);

  dateField.innerText = dateString;
})();

