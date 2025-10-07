import { getMultiTrainerQuestions, updateMultiTrainerQuestions } from "./firebase.js";

// Load questions when page loads
document.addEventListener("DOMContentLoaded", async () => {
  await loadQuestions();

  document.getElementById("saveQuestionsBtn")
    .addEventListener("click", saveQuestions);
});

async function loadQuestions() {
  const questions = await getMultiTrainerQuestions();
  const listDiv = document.getElementById("questionList");
  listDiv.innerHTML = "";

  questions.forEach((q, index) => {
    const label = document.createElement("label");
    label.textContent = `Question ${index + 1}`;
    label.htmlFor = `question-${index}`;

    const input = document.createElement("input");
    input.type = "text";
    input.id = `question-${index}`;
    input.value = q;
    input.style.display = "block";
    input.style.marginBottom = "10px";

    listDiv.appendChild(label);
    listDiv.appendChild(input);
  });
}

async function saveQuestions() {
  const inputs = document.querySelectorAll("#questionList input");
  const updated = Array.from(inputs).map(input => input.value.trim());
  const saveStatus = document.getElementById("saveStatus");

  try {
    await updateMultiTrainerQuestions(updated);
    saveStatus.textContent = "✅ Questions updated successfully!";
    saveStatus.style.color = "white";
  } catch (err) {
    saveStatus.textContent = "❌ Error saving: " + err.message;
    saveStatus.style.color = "red";
  }

  saveStatus.style.display = "block";
  console.log(saveStatus);
  setTimeout(() => saveStatus.style.display = "none", 3000);
}

