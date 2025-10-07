import { getMultiTrainerQuestions } from "./firebase.js";

let analysisData = null;
let fileData = null;
let cachedQuestions = null;

// File upload handling
document.getElementById("fileInput").addEventListener("change", handleFile);

const uploadArea = document.querySelector(".upload-area");
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById("fileInput").files = files;
    handleFile();
  }
});

function handleFile() {
  const file = document.getElementById("fileInput").files[0];
  if (file) {
    document.getElementById("fileInfo").innerHTML = `
                    <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                        <strong>Selected:</strong> ${file.name} (${(
      file.size / 1024
    ).toFixed(1)} KB)
                    </div>
                `;
  }
}

async function processFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Please select an Excel file first");
    return;
  }

  // Load questions from Firebase if not cached
  if (!cachedQuestions) {
    try {
      cachedQuestions = await getMultiTrainerQuestions();
    } catch (error) {
      console.warn("Could not load questions from Firebase:", error);
      // Will use default questions in generatePDF if loading fails
    }
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      fileData = jsonData;
      analysisData = analyzeData(jsonData);
      // Show the section first
      const analysisSection = document.getElementById("analysisSection");
      analysisSection.style.display = "block";

      // Then display results and scroll
      displayResults(analysisData).then(() => {
        // Wait a brief moment to ensure DOM is updated
        setTimeout(() => {
          analysisSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      });
    } catch (error) {
      showError("Error processing file: " + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function analyzeData(data) {
  if (data.length < 2) {
    throw new Error("File must contain headers and at least one data row");
  }

  const headers = data[0];
  const rows = data.slice(1);

  // Determine format type
  const isMultiTrainer = headers.some(
    (h) => typeof h === "string" && (h.includes("3") || h.includes("4"))
  );

  if (isMultiTrainer) {
    return analyzeMultiTrainerFormat(headers, rows);
  } else {
    return analyzeSingleTrainerFormat(headers, rows);
  }
}

function analyzeMultiTrainerFormat(headers, rows) {
  // Extract trainer names (first occurrence of each trainer)
  const trainerNames = [];
  const trainerPattern = /^([^0-9]+?)(?:\d+)?$/;

  headers.forEach((header) => {
    if (typeof header === "string") {
      const match = header.match(trainerPattern);
      if (match) {
        const trainerName = match[1].trim();
        console.log(trainerName);
        if (
          trainerName &&
          /^[A-Za-z\s]+$/.test(trainerName) &&
          !trainerNames.includes(trainerName) &&
          ![
            "ID",
            "Start time",
            "Completion time",
            "Email",
            "Name",
            "Last modified time",
            "Attention",
            "What",
          ].includes(trainerName)
        ) {
          trainerNames.push(trainerName);
        }
      }
    }
  });
  console.log(trainerNames);

  const results = [];

  trainerNames.forEach((trainerName) => {
    // Find columns for this trainer (4 questions per trainer)
    const trainerColumns = [];
    headers.forEach((header, index) => {
      if (typeof header === "string" && header.includes(trainerName)) {
        trainerColumns.push(index);
      }
    });

    // Calculate rating breakdown and average
    const ratingBreakdown = [0, 0, 0, 0, 0]; // Excellent, Very good, Good, Average, Poor
    let totalScore = 0;
    let responseCount = 0;

    const columnBreakdowns = trainerColumns.map(() => [0, 0, 0, 0, 0]);
    const columnTotal = [0, 0, 0, 0, 0];

    rows.forEach((row) => {
      trainerColumns.forEach((colIndex, questionIndex) => {
        const value = row[colIndex];
        if (value && typeof value === "string") {
          const score = getScoreFromRating(value);
          if (score > 0) {
            totalScore += score;
            responseCount++;
            ratingBreakdown[5 - score]++; // Index 0 = Excellent (5), Index 4 = Poor (1)
            columnBreakdowns[questionIndex][5 - score]++;
            columnTotal[questionIndex]++;
          }
        }
      });
    });
    console.log(columnBreakdowns);
    const averageRating =
      responseCount > 0 ? (totalScore / responseCount).toFixed(2) : 0;

    // Extract feedback
    const positiveIndex = headers.findIndex(
      (h) => typeof h === "string" && h.includes("went well")
    );
    const improvementIndex = headers.findIndex(
      (h) => typeof h === "string" && h.includes("improvement")
    );

    const positiveFeedback = extractFeedback(rows, positiveIndex);
    const improvementFeedback = extractFeedback(rows, improvementIndex);

    results.push({
      name: trainerName,
      rating: averageRating,
      responseCount: Math.floor(responseCount / 4), // Divide by 4 questions per trainer
      positiveFeedback,
      improvementFeedback,
      columnResponseCount: columnTotal,
      breakdown: columnBreakdowns,
      isMultiTrainer: true,
    });
  });

  return results;
}

function analyzeSingleTrainerFormat(headers, rows) {
  // Prompt user for trainer name
  const trainerName = prompt("Please enter the trainer name:", "");

  // Find overall rating column
  const ratingIndex = headers.findIndex(
    (h) => typeof h === "string" && h.includes("Overall program rating")
  );
  console.log("rating\n");
  console.log(ratingIndex);
  const trainerColumnStrings = [];
  const trainerColumns = [];
  headers.forEach((header, index) => {
    if (
      typeof header === "string" &&
      [
        ratingIndex + 1,
        ratingIndex + 2,
        ratingIndex + 3,
        ratingIndex + 4,
      ].includes(index)
    ) {
        trainerColumnStrings.push(header);
      trainerColumns.push(index);
    }
  });
  let totalScore = 0;
  let responseCount = 0;
  const ratingBreakdown = [0, 0, 0, 0, 0]; // Excellent, Very good, Good, Average, Poor
  if (ratingIndex >= 0) {
    rows.forEach((row) => {
      const value = row[ratingIndex];
      if (value > 0) {
        totalScore += value;
        responseCount++;
        ratingBreakdown[5 - value]++; // Index 0 = Excellent (5), Index 4 = Poor (1)
      }
    });
  }
  const columnBreakdowns = trainerColumns.map(() => [0, 0, 0, 0, 0]);
  const columnTotal = [0, 0, 0, 0, 0];

  rows.forEach((row) => {
    trainerColumns.forEach((colIndex, questionIndex) => {
      const value = row[colIndex];
      if (value && typeof value === "string") {
        const score = getScoreFromRating(value);
        if (score > 0) {
          columnBreakdowns[questionIndex][5 - score]++;
          columnTotal[questionIndex]++;
        }
      }
    });
  });
  const averageRating =
    responseCount > 0 ? (totalScore / responseCount).toFixed(2) : 0;

  // Extract feedback
  const positiveIndex = headers.findIndex(
    (h) => typeof h === "string" && h.includes("went well")
  );
  const improvementIndex = headers.findIndex(
    (h) => typeof h === "string" && h.includes("improvement")
  );

  const positiveFeedback = extractFeedback(rows, positiveIndex);
  const improvementFeedback = extractFeedback(rows, improvementIndex);
  console.log(columnBreakdowns);
  return [
    {
      name: trainerName,
      rating: averageRating,
      responseCount,
      positiveFeedback,
      improvementFeedback,
      breakdown: columnBreakdowns,
      questions: trainerColumnStrings,
      columnResponseCount: columnTotal,
      isMultiTrainer: false,
    },
  ];
}

function getScoreFromRating(rating) {
  if (typeof rating !== "string") return 0;
  const r = rating.toLowerCase().trim();
  switch (r) {
    case "excellent":
      return 5;
    case "very good":
      return 4;
    case "good":
      return 3;
    case "average":
      return 2;
    case "poor":
      return 1;
    default:
      return 0;
  }
}

function extractFeedback(rows, columnIndex) {
  if (columnIndex < 0) return [];

  const feedback = [];
  rows.forEach((row) => {
    const value = row[columnIndex];
    if (value && typeof value === "string" && value.trim().length > 10) {
      feedback.push(value.trim());
    }
  });

  // Remove duplicates and get top 5 most meaningful feedback
  const uniqueFeedback = [...new Set(feedback)];
  return uniqueFeedback
    .filter((f) => f.length > 15) // Filter out very short feedback
    .slice(0, 5); // Take top 5
}

let currentTrainerIndex = 0;
let trainersData = [];

async function displayResults(data) {
  trainersData = data;
  const resultsDiv = document.getElementById("analysisResults");
  let html = `
          <div class="trainer-navigation">
            <button id="prevButton">&lt; Previous</button>
            <span id="trainerCounter">Trainer 1 of ${data.length}</span>
            <button id="nextButton">Next &gt;</button>
          </div>
          <div id="trainerContainer"></div>
        `;

  // Save data to Firebase
  try {
    for (const trainerData of data) {
      await saveTrainerFeedback(trainerData);
    }
    showSuccess("Feedback data saved to database successfully!");
  } catch (error) {
    console.error("Error saving to Firebase:", error);
    showError("Error saving feedback data to database");
  }

  resultsDiv.innerHTML = html;
  document.getElementById("nextButton").addEventListener("click", nextTrainer);
  document
    .getElementById("prevButton")
    .addEventListener("click", previousTrainer);
  displayTrainer(0);
}

function displayTrainer(index) {
  const trainer = trainersData[index];
  const container = document.getElementById("trainerContainer");

  container.innerHTML = `
          <div class="trainer-card">
            <div class="trainer-name">${trainer.name}</div>
            <div class="overall-rating">
                Overall Rating: ${trainer.rating}/5.0 (${
    trainer.responseCount
  } responses)
            </div>

            <div class="feedback-section">
                <div class="feedback-title">What went well</div>
                <ul class="feedback-list">
                    ${
                      trainer.positiveFeedback
                        .map((f) => `<li>${f}</li>`)
                        .join("") || "<li>No positive feedback provided</li>"
                    }
                </ul>
            </div>

            <div class="feedback-section">
                <div class="feedback-title">What needs improvement</div>
                <ul class="feedback-list">
                    ${
                      trainer.improvementFeedback
                        .map((f) => `<li>${f}</li>`)
                        .join("") ||
                      "<li>No improvement suggestions provided</li>"
                    }
                </ul>
            </div>
          </div>
        `;

  document.getElementById("trainerCounter").textContent = `Trainer ${
    index + 1
  } of ${trainersData.length}`;

  // Update button states
  document.getElementById("prevButton").disabled = index === 0;
  document.getElementById("nextButton").disabled =
    index === trainersData.length - 1;
}

function nextTrainer() {
  console.log(
    "Next pressed. Current index:",
    currentTrainerIndex,
    "of",
    trainersData.length
  );
  if (currentTrainerIndex < trainersData.length - 1) {
    currentTrainerIndex++;
    console.log("Moving to trainer index:", currentTrainerIndex);
    displayTrainer(currentTrainerIndex);
  }
}

function previousTrainer() {
  if (currentTrainerIndex > 0) {
    currentTrainerIndex--;
    displayTrainer(currentTrainerIndex);
  }
}

async function generatePDFs() {
  if (!analysisData) return;

  const btn = document.getElementById("generateBtn");
  const progress = document.getElementById("progress");
  const progressFill = document.getElementById("progressFill");

  btn.disabled = true;
  progress.style.display = "block";

  try {
    for (let i = 0; i < analysisData.length; i++) {
      const trainer = analysisData[i];
      progressFill.style.width = `${((i + 1) / analysisData.length) * 100}%`;

      await generatePDF(trainer);

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    showSuccess(`Successfully generated ${analysisData.length} PDF report(s)!`);
  } catch (error) {
    showError("Error generating PDFs: " + error.message);
  } finally {
    btn.disabled = false;
    progress.style.display = "none";
    progressFill.style.width = "0%";
  }
}

function generatePDF(trainer) {
  return new Promise((resolve) => {
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [30, 30, 30, 30],
      content: [
        // Title + optional branding
        {
          text: "ILP - Tech Fundamentals Feedback Report",
          style: "title",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `Trainer: ${trainer.name}`,
          style: "subtitle",
          alignment: "center",
          margin: [0, 0, 0, 20],
        },

        // Key Metrics Table
        {
          table: {
            widths: ["25%", "25%", "25%", "25%"],
            body: [
              [
                { text: "Batch Name", style: "tableHeader" },
                { text: "Trainees", style: "tableHeader" },
                { text: "Trainer", style: "tableHeader" },
                {
                  text: "Program Rating (out of 5)",
                  style: "tableHeader",
                },
              ],
              [
                { text: "ILP 2024-25 Batch", style: "tableData" },
                {
                  text: trainer.responseCount.toString(),
                  style: "highlightCell",
                },
                { text: trainer.name, style: "tableData" },
                { text: trainer.rating, style: "highlightCell" },
              ],
            ],
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? "#E8EDF1" : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#aaa",
            vLineColor: () => "#aaa",
          },
          margin: [0, 0, 0, 20],
        },
      ],

      styles: {
        title: { fontSize: 18, bold: true, color: "#2C3E50" },
        subtitle: { fontSize: 12, italics: true, color: "#555" },
        tableHeader: {
          fontSize: 10,
          bold: true,
          fillColor: "#f2f2f2",
          color: "#333",
          alignment: "center",
        },
        tableData: {
          fontSize: 9,
          alignment: "center",
          margin: [2, 4, 2, 4],
        },
        highlightCell: {
          fontSize: 10,
          bold: true,
          color: "#2E86C1",
          alignment: "center",
          margin: [2, 4, 2, 4],
        },
        questionHeader: {
          fontSize: 8,
          bold: true,
          alignment: "center",
          margin: [2, 2, 2, 2],
        },
        ratingData: {
          fontSize: 9,
          alignment: "center",
          margin: [2, 2, 2, 2],
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: "#1A5276",
          margin: [0, 15, 0, 8],
        },
        feedbackText: {
          fontSize: 9,
          margin: [0, 2, 0, 2],
          alignment: "justify",
        },
        totalRowLabel: {
          fontSize: 9,
          alignment: "left",
          margin: [2, 4, 2, 4],
        },
      },
    };

    // Multi-trainer breakdown section
    if (trainer.isMultiTrainer || !trainer.isMultiTrainer) {
      console.log("etheetond");
      docDefinition.content.push({
        text: "Trainer Rating Breakdown",
        style: "sectionHeader",
      });

      const sampleData = [
        ["Excellent", "20", "2", "2", "20"],
        ["Very good", "4", "22", "24", "4"],
        ["Good", "0", "0", "0", "0"],
        ["Average", "0", "0", "0", "0"],
        ["Poor", "0", "0", "0", "0"],
      ];
      // const ratingRows = sampleData.map((row) => [
      //   { text: row[0], style: "ratingData", alignment: "left" },
      //   { text: row[1], style: "ratingData" },
      //   { text: row[2], style: "ratingData" },
      //   { text: row[3], style: "ratingData" },
      //   { text: row[4], style: "ratingData" },
      // ]);
      const ratingRows = [];
      const ratingCategories = [
        "Excellent",
        "Very Good",
        "Good",
        "Average",
        "Poor",
      ];
      console.log("hello\n");
      console.log(trainer.columnBreakdowns);
      for (let i = 0; i < 5; i++) {
        // 5 categories: Excellent, Very Good, Good, Average, Poor
        const row = [
          {
            text: ratingCategories[i],
            style: "ratingData",
            alignment: "left",
          },
          ...trainer.breakdown.map((col) => ({
            text: col[i], // Get the count for this rating category in each trainer's column
            style: "ratingData",
          })),
        ];
        ratingRows.push(row);
      }
      // Use cached questions or default ones if not available
      const questions = cachedQuestions || [
        "Adequate opportunity to clarify concepts",
        "Appropriate activities & interactions",
        "Trainer expertise & approachability",
        "Encouraged participation & enthusiasm",
      ];
      let newRow;
      if (!trainer.isMultiTrainer) {
        newRow = [
        { text: "", style: "questionHeader" },
        ...(trainer.questions).map((q) => ({
          text: q,
          style: "questionHeader",
        })),
      ];
      }
      else {
        newRow = [
        { text: "", style: "questionHeader" },
        ...questions.map((q) => ({
          text: q,
          style: "questionHeader",
        })),
      ];
      }
      
      ratingRows.unshift(newRow);
      ratingRows.push([
        { text: "Total responded trainees", style: "totalRowLabel" },
        {
          text: trainer.columnResponseCount[0].toString(),
          style: "ratingData",
        },
        {
          text: trainer.columnResponseCount[1].toString(),
          style: "ratingData",
        },
        {
          text: trainer.columnResponseCount[2].toString(),
          style: "ratingData",
        },
        {
          text: trainer.columnResponseCount[3].toString(),
          style: "ratingData",
        },
      ]);

      const ratingTable = {
        table: {
          widths: ["20%", "20%", "20%", "20%", "20%"],
          body: ratingRows,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex % 2 === 0 ? "#f9f9f9" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#ddd",
          vLineColor: () => "#ddd",
        },
        margin: [0, 0, 0, 20],
      };

      docDefinition.content.push(ratingTable);
    }

    // Positive Feedback
    docDefinition.content.push({
      text: "What went well",
      style: "sectionHeader",
    });

    docDefinition.content.push({
      ul:
        trainer.positiveFeedback.length > 0
          ? trainer.positiveFeedback.map((f) => ({
              text: f,
              style: "feedbackText",
            }))
          : [
              {
                text: "No positive feedback provided.",
                style: "feedbackText",
              },
            ],
    });

    // Improvement Feedback
    docDefinition.content.push({
      text: "What needs improvement",
      style: "sectionHeader",
    });

    docDefinition.content.push({
      ul:
        trainer.improvementFeedback.length > 0
          ? trainer.improvementFeedback.map((f) => ({
              text: f,
              style: "feedbackText",
            }))
          : [
              {
                text: "No improvement feedback provided.",
                style: "feedbackText",
              },
            ],
    });

    // Generate PDF
    pdfMake
      .createPdf(docDefinition)
      .download(
        `${trainer.name.replace(/[^a-z0-9]/gi, "_")}_Feedback_Report.pdf`
      );

    resolve();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyzeBtn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", processFile);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", generatePDFs);
  }
});

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;
  document.querySelector(".upload-section").appendChild(errorDiv);
  errorDiv.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success";
  successDiv.textContent = message;
  document.querySelector(".generate-section").appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 5000);
}

window.saveQuestions = saveQuestions;
window.processFile = processFile;
window.nextTrainer = nextTrainer;
window.previousTrainer = previousTrainer;
