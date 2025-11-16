"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DocumentQA =
/*#__PURE__*/
function () {
  function DocumentQA() {
    _classCallCheck(this, DocumentQA);

    this.form = document.getElementById('qaForm');
    this.fileInput = document.getElementById('documentFile');
    this.fileUploadArea = document.getElementById('fileUploadArea');
    this.browseBtn = document.getElementById('browseBtn');
    this.fileInfo = document.getElementById('fileInfo');
    this.fileName = document.getElementById('fileName');
    this.removeFileBtn = document.getElementById('removeFile');
    this.resultsContainer = document.getElementById('results');
    this.answersList = document.getElementById('answersList');
    this.errorContainer = document.getElementById('error');
    this.errorMessage = document.getElementById('errorMessage');
    this.submitBtn = document.getElementById('submitBtn');
    this.btnText = this.submitBtn.querySelector('.btn-text');
    this.btnLoading = this.submitBtn.querySelector('.btn-loading');
    this.selectedFile = null;
    this.backendUrl = 'http://localhost:10000'; // Fixed backend URL

    this.initEventListeners();
  }

  _createClass(DocumentQA, [{
    key: "initEventListeners",
    value: function initEventListeners() {
      var _this = this;

      // Form submission
      this.form.addEventListener('submit', function (e) {
        return _this.handleSubmit(e);
      }); // File upload events

      this.browseBtn.addEventListener('click', function () {
        return _this.fileInput.click();
      });
      this.fileInput.addEventListener('change', function (e) {
        return _this.handleFileSelect(e);
      });
      this.removeFileBtn.addEventListener('click', function () {
        return _this.removeFile();
      }); // Drag and drop events

      this.fileUploadArea.addEventListener('dragover', function (e) {
        return _this.handleDragOver(e);
      });
      this.fileUploadArea.addEventListener('dragleave', function (e) {
        return _this.handleDragLeave(e);
      });
      this.fileUploadArea.addEventListener('drop', function (e) {
        return _this.handleDrop(e);
      });
    }
  }, {
    key: "handleDragOver",
    value: function handleDragOver(e) {
      e.preventDefault();
      this.fileUploadArea.classList.add('drag-over');
    }
  }, {
    key: "handleDragLeave",
    value: function handleDragLeave(e) {
      e.preventDefault();
      this.fileUploadArea.classList.remove('drag-over');
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(e) {
      e.preventDefault();
      this.fileUploadArea.classList.remove('drag-over');
      var files = e.dataTransfer.files;

      if (files.length > 0) {
        this.processFile(files[0]);
      }
    }
  }, {
    key: "handleFileSelect",
    value: function handleFileSelect(e) {
      var files = e.target.files;

      if (files.length > 0) {
        this.processFile(files[0]);
      }
    }
  }, {
    key: "processFile",
    value: function processFile(file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        this.displayError('Please select a PDF file');
        return;
      } // Validate file size (10MB limit)


      var maxSize = 10 * 1024 * 1024; // 10MB in bytes

      if (file.size > maxSize) {
        this.displayError('File size must be less than 10MB');
        return;
      }

      this.selectedFile = file;
      this.displayFileInfo(file);
      this.hideError();
    }
  }, {
    key: "displayFileInfo",
    value: function displayFileInfo(file) {
      var fileSize = this.formatFileSize(file.size);
      this.fileName.innerHTML = "".concat(file.name, " <span class=\"file-size\">(").concat(fileSize, ")</span>");
      this.fileInfo.style.display = 'flex';
    }
  }, {
    key: "formatFileSize",
    value: function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      var k = 1024;
      var sizes = ['Bytes', 'KB', 'MB', 'GB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }, {
    key: "removeFile",
    value: function removeFile() {
      this.selectedFile = null;
      this.fileInput.value = '';
      this.fileInfo.style.display = 'none';
    }
  }, {
    key: "handleSubmit",
    value: function handleSubmit(e) {
      var questions, response;
      return regeneratorRuntime.async(function handleSubmit$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              e.preventDefault();
              questions = document.getElementById('questions').value; // Validate inputs

              if (this.validateInputs(questions)) {
                _context.next = 4;
                break;
              }

              return _context.abrupt("return");

            case 4:
              this.showLoading();
              this.hideResults();
              this.hideError();
              _context.prev = 7;
              _context.next = 10;
              return regeneratorRuntime.awrap(this.callBackendAPI(questions));

            case 10:
              response = _context.sent;
              this.displayResults(response);
              _context.next = 18;
              break;

            case 14:
              _context.prev = 14;
              _context.t0 = _context["catch"](7);
              console.error('Error:', _context.t0);
              this.displayError(_context.t0.message);

            case 18:
              _context.prev = 18;
              this.hideLoading();
              return _context.finish(18);

            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[7, 14, 18, 21]]);
    }
  }, {
    key: "callBackendAPI",
    value: function callBackendAPI(questions) {
      var questionList, formData, response, errorText, data;
      return regeneratorRuntime.async(function callBackendAPI$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              questionList = questions.split('\n').map(function (q) {
                return q.trim();
              }).filter(function (q) {
                return q.length > 0;
              }); // Create FormData for file upload

              formData = new FormData();
              formData.append('file', this.selectedFile);
              formData.append('questions', JSON.stringify(questionList));
              _context2.next = 6;
              return regeneratorRuntime.awrap(fetch("".concat(this.backendUrl, "/api/v1/hackrx/upload"), {
                method: 'POST',
                body: formData
              }));

            case 6:
              response = _context2.sent;

              if (response.ok) {
                _context2.next = 12;
                break;
              }

              _context2.next = 10;
              return regeneratorRuntime.awrap(response.text());

            case 10:
              errorText = _context2.sent;
              throw new Error("Server error (".concat(response.status, "): ").concat(errorText));

            case 12:
              _context2.next = 14;
              return regeneratorRuntime.awrap(response.json());

            case 14:
              data = _context2.sent;

              if (!data.error) {
                _context2.next = 17;
                break;
              }

              throw new Error(data.error);

            case 17:
              return _context2.abrupt("return", data);

            case 18:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "validateInputs",
    value: function validateInputs(questions) {
      // Clear previous errors
      this.hideError();
      var errors = [];

      if (!this.selectedFile) {
        errors.push('Please select a PDF file');
      }

      if (!questions) {
        errors.push('Please enter at least one question');
      }

      if (errors.length > 0) {
        this.displayError(errors.join('<br>'));
        return false;
      }

      return true;
    }
  }, {
    key: "showLoading",
    value: function showLoading() {
      this.submitBtn.disabled = true;
      this.btnText.style.display = 'none';
      this.btnLoading.style.display = 'inline-block';
    }
  }, {
    key: "hideLoading",
    value: function hideLoading() {
      this.submitBtn.disabled = false;
      this.btnText.style.display = 'inline-block';
      this.btnLoading.style.display = 'none';
    }
  }, {
    key: "displayResults",
    value: function displayResults(data) {
      var _this2 = this;

      this.answersList.innerHTML = '';

      if (data.answers && data.answers.length > 0) {
        // Add answer count to title
        var title = this.resultsContainer.querySelector('h2');
        title.innerHTML = "\uD83D\uDCCB Answers <span class=\"answer-count\">".concat(data.answers.length, " results</span>");
        data.answers.forEach(function (item, index) {
          var answerElement = _this2.createAnswerElement(item, index);

          _this2.answersList.appendChild(answerElement);
        });
        this.showResults();
      } else {
        this.displayError('No answers received from the server');
      }
    }
  }, {
    key: "createAnswerElement",
    value: function createAnswerElement(item, index) {
      var div = document.createElement('div');
      div.className = 'answer-item';
      var question = item.question || "Question ".concat(index + 1);
      var answer = item.answer || 'No answer provided';
      div.innerHTML = "\n            <h3>".concat(this.escapeHtml(question), "</h3>\n            <p>").concat(this.formatAnswer(answer), "</p>\n        ");
      return div;
    }
  }, {
    key: "formatAnswer",
    value: function formatAnswer(answer) {
      // Convert line breaks and preserve formatting
      return this.escapeHtml(answer).replace(/\n/g, '<br>');
    }
  }, {
    key: "escapeHtml",
    value: function escapeHtml(unsafe) {
      return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
  }, {
    key: "showResults",
    value: function showResults() {
      this.resultsContainer.style.display = 'block';
      this.resultsContainer.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, {
    key: "hideResults",
    value: function hideResults() {
      this.resultsContainer.style.display = 'none';
    }
  }, {
    key: "displayError",
    value: function displayError(message) {
      this.errorMessage.innerHTML = message;
      this.errorContainer.style.display = 'block';
      this.errorContainer.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, {
    key: "hideError",
    value: function hideError() {
      this.errorContainer.style.display = 'none';
    }
  }]);

  return DocumentQA;
}(); // Initialize the application when DOM is loaded


document.addEventListener('DOMContentLoaded', function () {
  new DocumentQA(); // Add some sample data for testing

  var sampleQuestions = document.getElementById('questions');

  if (!sampleQuestions.value) {
    sampleQuestions.value = "What is the main purpose of this document?\nWhat are the key terms and conditions?\nHow does the process work?\nWhat are the important clauses?";
  }
});
//# sourceMappingURL=script.dev.js.map
